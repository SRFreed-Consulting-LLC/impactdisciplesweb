import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { IClientAuthorizeCallbackData, ICreateOrderRequest, IPayPalConfig, ITransactionItem, IUnitAmount, IUnitBreakdown } from 'ngx-paypal';
import { CartItem, CheckoutForm } from 'src/app/common/models/utils/cart.model';
import { SaleModel } from 'src/app/common/models/utils/sale.model';
import { WebConfigModel } from 'src/app/common/models/utils/web-config.model';
import { PurchasesService } from 'src/app/common/services/data/purchases.service';
import { SalesService } from 'src/app/common/services/data/sales.service';
import { ShippingService } from 'src/app/common/services/data/shipping.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { EMailService } from 'src/app/common/services/data/email.service';
import { LoggerService } from 'src/app/common/services/data/logger.service';
import { TaxRateService } from 'src/app/common/services/utils/tax-rate.service';
import { EnumHelper } from 'src/app/common/utils/enum_helper';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { ToastService } from 'src/app/shared/utils/services/toast.service';
import { CartService } from '../services/cart.service';
import { PricingService } from '../services/pricing.service';
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

  NumberUtil = NumberUtil;

  submitting = false;
  showEstimatedTaxesSpinner = false;
  showShippingSpinner = false;

  public payPalConfig?: IPayPalConfig;
  currency = 'USD';

  constructor(
    public cartService: CartService,
    private pricingService: PricingService,
    private purchasesService: PurchasesService,
    private shippingService: ShippingService,
    private taxService: TaxRateService,
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
    this.submitting = true;

    await Promise.all([this.calculateShippingCost(), this.calculateEstimatedTax()]);

    if (this.orderTotal() > 0) {
      this.createPaypalConfig();
    } else {
      this.submitRequest();
    }

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

  private calculateEstimatedTax = async (): Promise<void> => {
    if (this.subtotal() > 0 && this.checkoutForm.shippingAddress.state === 'Georgia') {
      this.showEstimatedTaxesSpinner = true;
      this.checkoutForm = await this.taxService.calculateTaxRate(this.checkoutForm);
    } else {
      this.checkoutForm.estimatedTaxes = 0;
    }
  };

  private calculateShippingCost = async (): Promise<void> => {
    this.showShippingSpinner = true;
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

  private createPaypalConfig(): void {
    const itemUnitTotal: IUnitAmount = { currency_code: this.currency, value: this.subtotal().toFixed(2).toString() };
    const discountTotal: IUnitAmount = { currency_code: this.currency, value: this.totalDiscount()?.toFixed(2).toString() };
    const shippingTotal: IUnitAmount = { currency_code: this.currency, value: this.checkoutForm.shippingRate.toFixed(2).toString() };
    const shippingDiscountTotal: IUnitAmount = {
      currency_code: this.currency,
      value: (this.subtotal() > this.webConfig.freeShippingAmount ? this.checkoutForm.shippingRate : 0).toFixed(2).toString()
    };
    const taxesTotal: IUnitAmount = { currency_code: this.currency, value: this.checkoutForm.estimatedTaxes?.toFixed(2).toString() };

    const breakdown: IUnitBreakdown = {
      item_total: itemUnitTotal,
      shipping: shippingTotal,
      shipping_discount: shippingDiscountTotal,
      tax_total: taxesTotal,
      discount: discountTotal
    };

    const amount: IUnitAmount = { currency_code: this.currency, value: this.orderTotal().toFixed(2).toString(), breakdown };

    const items: ITransactionItem[] = this.checkoutForm.cartItems.map(item => ({
      name: item.itemName,
      quantity: item.orderQuantity.toString(),
      category: 'DIGITAL_GOODS',
      unit_amount: { currency_code: this.currency, value: this.pricingService.effectiveUnitPrice(item).toFixed(2).toString() }
    } as ITransactionItem));

    this.payPalConfig = {
      currency: this.currency,
      clientId: this.webConfig.paypalClientId,
      createOrderOnClient: () => ({
        intent: 'CAPTURE',
        purchase_units: [{ amount, items }]
      } as ICreateOrderRequest),
      advanced: { commit: 'true' },
      style: { label: 'paypal', layout: 'vertical', color: 'blue', shape: 'rect' },
      onApprove: () => {},
      onClientAuthorization: (data) => {
        this.submitRequest(data);
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

  submitRequest(data?: IClientAuthorizeCallbackData): void {
    this.submitting = true;

    if (data) {
      this.checkoutForm.payPalReceipt = data;
      this.checkoutForm.receipt = data.id;
    } else if (this.checkoutForm.couponCode) {
      this.checkoutForm.receipt = 'COUPON';
    } else {
      this.checkoutForm.receipt = 'FREE ONLY';
    }

    // total = subtotal here, not the grand order total -- matches the
    // original store's CheckoutForm.total semantic exactly (see
    // affiliate-sale recording in checkout-success, which computes
    // totalAfterDiscount = total - discount). Preserved deliberately so
    // this stays a compatible Firestore `purchases` document shape.
    this.checkoutForm.discount = this.totalDiscount();
    this.checkoutForm.total = this.subtotal();
    this.checkoutForm.processedStatus = 'NEW';
    this.checkoutForm.dateProcessed = Timestamp.now();

    this.checkoutForm.cartItems.forEach(item => {
      item.dateProcessed = Timestamp.now();
      item.processedStatus = 'NEW';
      item.price = item.price && NumberUtil.isNumber(item.price) ? item.price : 0;
    });

    this.purchasesService.add(this.checkoutForm).then(() => {
      localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(this.checkoutForm));
      this.sendProductPurchaseSuccessEmail(this.checkoutForm);
      this.currentStep = 'confirm';
      this.router.navigateByUrl('/checkout-success');
    }).catch(err => {
      // Same must-not-fail-silently handling as the original checkout --
      // this runs after payment (PayPal or a $0/coupon order) has already
      // been finalized, so a failure here means the customer was
      // charged/accepted but no purchase record was saved.
      this.submitting = false;

      this.loggerService.logMessage(
        'CHECKOUT_NEW',
        this.checkoutForm.email,
        'Failed to save purchase after payment was captured/finalized.',
        { err, receipt: this.checkoutForm.receipt, payPalReceiptId: this.checkoutForm.payPalReceipt?.id }
      ).subscribe(errorCode => {
        this.toastService.notify({
          message: 'Your payment went through, but we hit a problem saving your order. ' +
            'Please contact us so we can complete it manually - reference code: ' + errorCode +
            (this.checkoutForm.payPalReceipt?.id ? ' (payment ref: ' + this.checkoutForm.payPalReceipt.id + ')' : ''),
          type: 'error'
        });
      });
    });
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
