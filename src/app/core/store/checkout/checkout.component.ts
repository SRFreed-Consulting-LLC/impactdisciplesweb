import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IOnApproveCallbackData, IPayPalConfig } from 'ngx-paypal';
import { CartItem, CheckoutForm } from 'src/app/common/models/utils/cart.model';
import { SaleModel } from 'src/app/common/models/utils/sale.model';
import { WebConfigModel } from 'src/app/common/models/utils/web-config.model';
import { SalesService } from 'src/app/common/services/data/sales.service';
import { ShippingService } from 'src/app/common/services/data/shipping.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { EMailService } from 'src/app/common/services/data/email.service';
import { LoggerService } from 'src/app/common/services/data/logger.service';
import { EnumHelper } from 'src/app/common/utils/enum_helper';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { ToastService } from 'src/app/shared/utils/services/toast.service';
import { CartService } from '../services/cart.service';
import { PricingService } from '../services/pricing.service';
import { CheckoutOrderService, CheckoutOrderRequest } from '../services/checkout-order.service';
import { CheckoutStep } from './checkout-steps/checkout-steps.component';

const CHECKOUT_STORAGE_KEY = 'checkoutForm';

// Copy of the original checkout.component.ts, restructured into a visible
// Shipping -> Payment -> Confirm flow (CheckoutStepsComponent) instead of
// the original's isShippingView/isBillingView booleans, with these
// deliberate fixes (see plan):
//  - Cart items always come straight from CartService, never from
//    fragile router `state` -- refresh/direct nav to /checkout
//    just works, no history.state?.data guard needed.
//  - Subtotal/discount/order-total all come from PricingService, replacing
//    this component's own third disagreeing calculator in the original.
//  - The dead, unread second coupon lookup (original's getCouponCode())
//    is gone entirely -- discount is already baked into cart items from
//    the cart page/drawer.
//  - Loading state uses a boolean + <app-spinner>, not raw
//    document.querySelector(...).classList manipulation.
//  - Payments: PayPal + $0/coupon only, matching the original store's
//    actual current capability -- Stripe is explicitly deferred (see plan's
//    Payments/guardrails section), so this stays an apples-to-apples
//    comparison with the original on payment options.
//  - Pricing/tax/discount is no longer computed client-side and trusted at
//    face value -- ported from the separate checkout-server-side-pricing
//    branch (see CheckoutOrderService's own comment for the full story).
//    This component now only ever sends item ids/quantities/selections to
//    the server (buildOrderRequest()) and displays back whatever the
//    server decided the order actually costs (startOrder()) -- it never
//    computes a chargeable total itself and never writes the "purchases"
//    record directly; only the server does that, after real payment
//    (or a genuinely-free order) is verified.
@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  standalone: false
})
export class CheckoutComponent implements OnInit {
  customerForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', Validators.required],
    phone: this.fb.group({
      number: ['', Validators.required]
    }),
    isNewsletter: [true]
  });
  shippingAddressForm: FormGroup = this.fb.group({
    address1: ['', Validators.required],
    address2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    zip: ['', Validators.required],
    country: ['United States', Validators.required]
  });

  checkoutForm: CheckoutForm = { ...new CheckoutForm() };
  currentStep: CheckoutStep = 'shipping';
  states: string[] = EnumHelper.getStateTypesAsArray();
  countries: string[] = EnumHelper.getCountryTypesAsArray();

  sales: SaleModel[] = [];
  webConfig: WebConfigModel;

  submitting = false;
  showEstimatedTaxesSpinner = false;
  showShippingSpinner = false;
  orderError = false;

  public payPalConfig?: IPayPalConfig;
  currency = 'USD';

  constructor(
    public cartService: CartService,
    private pricingService: PricingService,
    private checkoutOrderService: CheckoutOrderService,
    private shippingService: ShippingService,
    private emailService: EMailService,
    private salesService: SalesService,
    private webConfigService: WebConfigService,
    private router: Router,
    private toastService: ToastService,
    private loggerService: LoggerService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.checkoutForm = {
      cartItems: this.cartService.getCartProducts(),
      couponCode: this.cartService.getCouponCode(),
      shippingDiscount: 0,
      isShippingSameAsBilling: true,
      isNewsletter: true,
      shippingAddress: { state: '', country: 'United States' }
    };

    this.getActiveSales();
    this.getWebConfig();
  }

  isShippingAddressNeeded(): boolean {
    const shippingNotRequired = this.checkoutForm.cartItems
      .map(item => item.isEBook || item.isEvent || item.isDigitalBook)
      .every(Boolean);

    return !shippingNotRequired;
  }

  subtotal(): number {
    return this.pricingService.cartSubtotal(this.checkoutForm.cartItems);
  }

  totalDiscount(): number {
    return this.pricingService.cartDiscount(this.checkoutForm.cartItems);
  }

  orderTotal(): number {
    return this.pricingService.orderTotal(this.checkoutForm);
  }

  lineTotal(item: CartItem): number {
    return this.pricingService.lineTotal(item);
  }

  async goToPayment(): Promise<void> {
    this.customerForm.markAllAsTouched();
    if (this.isShippingAddressNeeded()) {
      this.shippingAddressForm.markAllAsTouched();
    }

    if (!this.customerForm.valid || (this.isShippingAddressNeeded() && !this.shippingAddressForm.valid)) {
      return;
    }

    this.applyFormValuesToCheckoutForm();
    this.currentStep = 'payment';
    this.orderError = false;
    this.submitting = true;
    this.showEstimatedTaxesSpinner = true;
    this.showShippingSpinner = true;

    // Shipping rate is still fetched (and its discount optimistically
    // guessed) client-side here, same as before -- it's just a real-time
    // rate lookup, not a price the customer could tamper with in a way
    // that matters. It's sent to the server below as part of the order
    // request; the server trusts the rate itself but always recomputes the
    // discount on it. See checkout-pricing.functions.ts's own comment.
    await this.calculateShippingCost();
    await this.startOrder();

    this.showEstimatedTaxesSpinner = false;
    this.showShippingSpinner = false;
    this.submitting = false;
  }

  async retryOrder(): Promise<void> {
    this.orderError = false;
    this.submitting = true;
    this.showEstimatedTaxesSpinner = true;
    this.showShippingSpinner = true;

    await this.startOrder();

    this.showEstimatedTaxesSpinner = false;
    this.showShippingSpinner = false;
    this.submitting = false;
  }

  backToShipping(): void {
    this.currentStep = 'shipping';
  }

  private applyFormValuesToCheckoutForm(): void {
    const customer = this.customerForm.getRawValue();
    this.checkoutForm.firstName = customer.firstName;
    this.checkoutForm.lastName = customer.lastName;
    this.checkoutForm.email = customer.email;
    this.checkoutForm.phone = { ...this.checkoutForm.phone, number: customer.phone.number };
    this.checkoutForm.isNewsletter = customer.isNewsletter;

    if (this.isShippingAddressNeeded()) {
      this.checkoutForm.shippingAddress = this.shippingAddressForm.getRawValue();
    }
  }

  private calculateShippingCost = async (): Promise<void> => {
    this.checkoutForm = await this.shippingService.calculateShipping(this.checkoutForm);

    if (this.subtotal() > this.webConfig.freeShippingAmount) {
      this.checkoutForm.shippingDiscount = this.checkoutForm.shippingRate;
      this.checkoutForm.shippingDiscountReason = 'Over $' + this.webConfig.freeShippingAmount;
    } else {
      const shippingSale = this.sales.find(sale => sale.isShipping);
      if (shippingSale) {
        const percentOff = NumberUtil.clampPercent(shippingSale.percentOff);
        this.checkoutForm.shippingDiscount = percentOff / 100 * this.checkoutForm.shippingRate;
        this.checkoutForm.shippingDiscountReason = percentOff + '% Off';
      }
    }
  };

  // Asks the server to price the order and, for a paid order, start a
  // PayPal order for it. Never computes or trusts a client-side total --
  // the server fetches real product/event data and coupon/sale rules
  // itself (see checkout-pricing.functions.ts) and this only ever displays
  // what comes back.
  private async startOrder(): Promise<void> {
    try {
      const result = await this.checkoutOrderService.createOrder(this.buildOrderRequest());

      if (result.free) {
        // Free (fully covered by a coupon, or genuinely $0) -- the server
        // already wrote the purchase record, since there's no payment to
        // capture first.
        await this.finishCheckout(result.checkoutForm);
      } else {
        this.checkoutForm.discount = result.breakdown.totalDiscount;
        this.checkoutForm.estimatedTaxes = result.breakdown.estimatedTaxes;
        this.checkoutForm.taxRate = result.breakdown.taxRate;
        this.checkoutForm.taxSource = result.breakdown.taxSource;
        this.checkoutForm.shippingDiscount = result.breakdown.shippingDiscount;
        this.checkoutForm.shippingDiscountReason = result.breakdown.shippingDiscountReason;
        this.createPaypalConfig(result.orderId);
      }
    } catch (err) {
      this.orderError = true;
      this.toastService.notify({ message: 'We could not start checkout. Please try again.', type: 'error' });
      this.loggerService.logMessage(
        'CHECKOUT', this.checkoutForm.email, 'Failed to create order.', { err: String(err) }
      ).subscribe();
    }
  }

  // Only ids/quantities/selections -- see checkout-order.service.ts's own
  // comment on why a price is never included here.
  private buildOrderRequest(): CheckoutOrderRequest {
    return {
      cartItems: this.checkoutForm.cartItems.map(item => ({
        id: item.id,
        isEvent: item.isEvent,
        isEBook: item.isEBook,
        isDigitalBook: item.isDigitalBook,
        orderQuantity: item.orderQuantity,
        size: item.size,
        color: item.color,
        language: item.language,
        attendees: item.attendees,
        followUpEmailId: item.followUpEmailId
      })),
      couponCode: this.checkoutForm.couponCode,
      firstName: this.checkoutForm.firstName,
      lastName: this.checkoutForm.lastName,
      email: this.checkoutForm.email,
      phone: this.checkoutForm.phone,
      isNewsletter: this.checkoutForm.isNewsletter,
      isShippingSameAsBilling: this.checkoutForm.isShippingSameAsBilling,
      billingAddress: this.checkoutForm.billingAddress,
      shippingAddress: this.checkoutForm.shippingAddress,
      shippingRate: this.checkoutForm.shippingRate,
      shippingRateId: this.checkoutForm.shippingRateId
    };
  }

  private createPaypalConfig(orderId: string): void {
    this.payPalConfig = {
      currency: this.currency,
      clientId: this.webConfig.paypalClientId,
      createOrderOnServer: () => Promise.resolve(orderId),
      advanced: { commit: 'true' },
      style: { label: 'paypal', layout: 'vertical', color: 'blue', shape: 'rect' },
      onApprove: () => {},
      authorizeOnServer: (data: IOnApproveCallbackData) => {
        this.submitting = true;

        return this.checkoutOrderService.captureOrder(orderId, data.payerID).then(result => {
          if (result.recordingFailed) {
            // Payment was already captured by PayPal -- only the purchase
            // record failed to save. Must not be shown as a normal
            // failure; the customer was actually charged. See
            // CaptureOrderResult's own comment.
            this.toastService.notify({
              message: 'Your payment went through, but we hit a problem saving your order. ' +
                'Please contact us so we can complete it manually - reference code: ' + result.errorCode +
                (result.payPalOrderId ? ' (payment ref: ' + result.payPalOrderId + ')' : ''),
              type: 'error'
            });
            return Promise.resolve();
          }

          return this.finishCheckout(result.checkoutForm);
        }).catch(err => {
          this.toastService.notify({ message: 'There was an error processing your payment. Please try again.', type: 'error' });
          this.loggerService.logMessage(
            'CHECKOUT', this.checkoutForm.email, 'Failed to capture PayPal payment.', { err: String(err), orderId }
          ).subscribe();
        }).finally(() => {
          this.submitting = false;
        });
      },
      onCancel: () => {},
      onError: () => {
        this.toastService.notify({ message: 'There was an error processing the Paypal Transaction', type: 'error' });
      },
      onClick: () => {}
    };
  }

  private getWebConfig(): void {
    this.webConfigService.getAll().then(config => {
      this.webConfig = config[0];
    });
  }

  private getActiveSales(): void {
    this.salesService.getAllByValue('isActive', true).then(sales => {
      const today = new Date();
      sales.forEach(sale => {
        const startDate = new Date(sale.startDate as string);
        const endDate = new Date(sale.endDate as string);
        if (startDate <= today && endDate >= today) {
          this.sales.push(sale);
        }
      });
    });
  }

  // No Firestore write happens here any more -- the server already made
  // it, only after a real payment was verified (or the order was
  // genuinely free). This just reflects that already-saved record back
  // into the UI/localStorage and moves on to the confirmation page.
  private async finishCheckout(checkoutForm: CheckoutForm): Promise<void> {
    this.checkoutForm = checkoutForm;
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(checkoutForm));
    this.sendProductPurchaseSuccessEmail(checkoutForm);
    this.currentStep = 'confirm';
    this.router.navigateByUrl('/checkout-success');
  }

  private sendProductPurchaseSuccessEmail(cart: CheckoutForm) {
    let ebooksPurchased = false;
    const USDollar = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    let html = "<table style='width: 90%;'>";
    html += "<tr><td></td><td style='text-align: left;'>PRODUCT</td><td style='text-align: right;'>PRICE</td><td style='text-align: right;'>DISCOUNT</td><td style='text-align: center;'>QUANTITY</td><td style='text-align: right;'>TOTAL</td><td style='text-align: left;'></td></tr>";

    cart.cartItems.forEach(product => {
      const unitPrice = this.pricingService.effectiveUnitPrice(product);
      html += '<tr>';
      html += "<td><img src='" + product.img.url + "' alt='" + product.img.name + "' height='100px'></img></td>";
      html += "<td style='text-align: left;'>" + product.itemName + '</td>';
      html += "<td style='text-align: right;'>" + USDollar.format(unitPrice) + '</td>';
      html += product.discount > 0
        ? "<td style='text-align: right;'>" + USDollar.format(product.discount) + '</td>'
        : '<td></td>';
      html += "<td style='text-align: center;'>" + product.orderQuantity + '</td>';
      html += "<td style='text-align: right;'>" + USDollar.format(this.pricingService.lineTotal(product)) + '</td>';

      if (product.isEBook) {
        html += "<td style='text-align: left;'><a href='" + product.eBookUrl.url + "' download>DOWNLOAD</a></td>";
      }
      if (product.isDigitalBook) {
        ebooksPurchased = true;
        html += "<td style='text-align: left;'>See install instuctions below!</td>";
      }
      html += '</tr>';
    });

    html += "<tr><td></td><td></td><td></td><td></td><td>SUBTOTAL</td><td style='text-align: right;'><b>" + USDollar.format(this.subtotal()) + '</b></td><td></td></tr>';

    if (cart.estimatedTaxes > 0) {
      html += "<tr><td></td><td></td><td></td><td></td><td>TAXES</td><td style='text-align: right;'><b> + " + USDollar.format(cart.estimatedTaxes) + '</b></td><td></td></tr>';
    }
    if (cart.shippingRate > 0) {
      html += "<tr><td></td><td></td><td></td><td></td><td>SHIPPING</td><td style='text-align: right;'><b> + " + USDollar.format(cart.shippingRate) + '</b></td><td></td></tr>';
    }
    if (cart.shippingDiscount > 0) {
      html += "<tr><td></td><td></td><td></td><td></td><td>SHIPPING DISCOUNT</td><td style='text-align: right;'><b> - " + USDollar.format(cart.shippingDiscount) + '</b></td><td></td></tr>';
    }
    if (cart.discount > 0) {
      html += "<tr><td></td><td></td><td></td><td></td><td>DISCOUNT</td><td style='text-align: right;'><b> - " + USDollar.format(cart.discount) + '</b></td><td></td></tr>';
    }

    html += "<tr><td></td><td></td><td></td><td></td><td>TOTAL</td><td style='text-align: right;'><b> = " + USDollar.format(this.orderTotal()) + '</b></td><td></td></tr>';
    html += '</table>';

    if (cart.receipt) {
      html += '<div>Confirmation Id: <b>' + cart.receipt + '</b></div>';
    }
    if (ebooksPurchased) {
      html += '<br><div><b>If you purchased an item from our Digital Library, instuctions for setting up the Library on your preferred Device can be found <a href="https://library.impactdisciples.com/install-instructions">here</a>!</b></div>';
      html += '<br><div>(For easy installation, it is best to open this email on your preferred Device and click the link!)</div>';
    }

    const form = {};
    form['firstName'] = cart.firstName;
    form['lastName'] = cart.lastName;
    form['email'] = cart.email;
    form['product_list'] = html;

    return this.emailService.sendHTMLEMailFromTemplate(cart.email, 'Sales Receipt', form);
  }
}
