import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IOnApproveCallbackData, IPayPalConfig, PayPalScriptService } from 'ngx-paypal';
import { CartItem, CheckoutForm } from 'src/app/common/models/utils/cart.model';
import { SaleModel } from '@impact-common/shared/models/utils/sale.model';
import { WebConfigModel } from 'src/app/common/models/utils/web-config.model';
import { ShippingService } from 'src/app/common/services/data/shipping.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { LoggerService } from 'src/app/common/services/data/logger.service';
import { EnumHelper } from 'src/app/common/utils/enum_helper';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { ToastService } from 'src/app/shared/utils/services/toast.service';
import { AttributionService } from 'src/app/shared/utils/services/attribution.service';
import { CartService } from '../services/cart.service';
import { PricingService } from '../services/pricing.service';
import { ProductCatalogService } from '../services/product-catalog.service';
import { CheckoutOrderService, CheckoutOrderRequest, CreateOrderBreakdown } from '../services/checkout-order.service';
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

  // Set once startOrder() gets a real response back -- from that point on,
  // subtotal()/totalDiscount()/orderTotal() below show these authoritative
  // server numbers instead of continuing to recompute a client-side
  // estimate that could drift from what's actually charged (rounding, a
  // sale/coupon changing between add-to-cart and checkout, etc). Before the
  // server responds (and if it fails), those methods fall back to
  // PricingService's optimistic estimate, same as before.
  private serverBreakdown: CreateOrderBreakdown | null = null;

  // Resolves once webConfig (and with it the PayPal client id) has loaded.
  // startOrder() awaits this before building the PayPal config -- the old
  // fire-and-forget getWebConfig() left a latent TypeError if the Firestore
  // read was slower than the user reaching the payment step.
  private webConfigReady: Promise<void> = Promise.resolve();

  constructor(
    public cartService: CartService,
    private pricingService: PricingService,
    private checkoutOrderService: CheckoutOrderService,
    private shippingService: ShippingService,
    private catalog: ProductCatalogService,
    private webConfigService: WebConfigService,
    private payPalScriptService: PayPalScriptService,
    private router: Router,
    private toastService: ToastService,
    private loggerService: LoggerService,
    private attributionService: AttributionService,
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

    // Perceived-latency fix, part 1: open the connection to PayPal's CDN
    // NOW, so the SDK download below doesn't also pay DNS+TLS setup.
    // Scoped to checkout on purpose -- index.html deliberately doesn't
    // preload payment resources site-wide (see its own comment).
    this.addPreconnect('https://www.paypal.com');
    this.addPreconnect('https://www.paypalobjects.com');

    this.getActiveSales();
    this.webConfigReady = this.getWebConfig().then(() => this.preloadPayPalSdk());
  }

  // Perceived-latency fix, part 2 (the big one): start downloading the
  // ~250KB PayPal JS SDK the moment the client id is known, instead of
  // only after the shipping-rate and create-order round-trips finish.
  // ngx-paypal's ScriptService short-circuits on window.paypal already
  // existing, so when <ngx-paypal> finally renders, the SDK loaded here is
  // reused and the buttons appear immediately. The params MUST match what
  // NgxPaypalComponent.initPayPalScript() would request for our config
  // (client-id + currency + commit) -- the SDK configures itself from its
  // script URL, and the later component render trusts whatever this loaded.
  private preloadPayPalSdk(): void {
    if (!this.webConfig?.paypalClientId) {
      return;
    }
    this.payPalScriptService.registerPayPalScript({
      clientId: this.webConfig.paypalClientId,
      currency: this.currency,
      commit: 'true',
      funding: false,
      extraParams: []
    }, () => { /* preload only - NgxPaypalComponent wires the buttons */ });
  }

  private addPreconnect(origin: string): void {
    if (document.head.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  isShippingAddressNeeded(): boolean {
    const shippingNotRequired = this.checkoutForm.cartItems
      .map(item => item.isEBook || item.isEvent || item.isDigitalBook)
      .every(Boolean);

    return !shippingNotRequired;
  }

  subtotal(): number {
    return this.serverBreakdown ? this.serverBreakdown.subtotal : this.pricingService.cartSubtotal(this.checkoutForm.cartItems);
  }

  totalDiscount(): number {
    return this.serverBreakdown ? this.serverBreakdown.totalDiscount : this.pricingService.cartDiscount(this.checkoutForm.cartItems);
  }

  orderTotal(): number {
    return this.serverBreakdown ? this.serverBreakdown.total : this.pricingService.orderTotal(this.checkoutForm);
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
    this.serverBreakdown = null;
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
    // The server's breakdown was quoted against the shipping/customer info
    // that's about to be edited -- revert to the optimistic client estimate
    // rather than keep showing a now-stale server total.
    this.serverBreakdown = null;
    this.payPalConfig = undefined;
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

      // Normally long resolved by now (it kicked off in ngOnInit, and the
      // SDK preload rode it) - this await only matters when the Firestore
      // config read is slower than the whole shipping+order chain, where
      // createPaypalConfig() below would previously have thrown on an
      // undefined webConfig.
      await this.webConfigReady;

      if (result.free) {
        // Free (fully covered by a coupon, or genuinely $0) -- the server
        // already wrote the purchase record, since there's no payment to
        // capture first.
        await this.finishCheckout(result.checkoutForm);
      } else {
        this.serverBreakdown = result.breakdown;
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
      shippingRateId: this.checkoutForm.shippingRateId,
      // Campaign attribution captured on landing (Campaign Manager v2,
      // Phase 4) - the server validates before crediting any campaign.
      ...(this.attributionService.get() ? { attribution: this.attributionService.get() } : {})
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

  private getWebConfig(): Promise<void> {
    return this.webConfigService.getAll().then(config => {
      this.webConfig = config[0];
    });
  }

  // Was a hand-duplicated copy of ProductCatalogService.getActiveSales()'s
  // isActive + date-range filter -- now calls the same shared, cached
  // method store/product-details/e-books already use, instead of running
  // its own independent (and uncached) Firestore query for the exact same
  // data.
  private getActiveSales(): void {
    this.catalog.getActiveSales().then(sales => {
      this.sales = sales;
    });
  }

  // No Firestore write happens here any more -- the server already made
  // it, only after a real payment was verified (or the order was
  // genuinely free). This just reflects that already-saved record back
  // into the UI and moves on to the confirmation page. sessionStorage (not
  // localStorage) on purpose: this is full checkout PII (name, email,
  // phone, addresses, PayPal receipt) that only exists to hand the order
  // to /checkout-success in this same tab, which deletes it once consumed.
  // sessionStorage keeps it out of other tabs and out of persistent
  // storage if the user closes the tab before the success page runs.
  private async finishCheckout(checkoutForm: CheckoutForm): Promise<void> {
    this.checkoutForm = checkoutForm;
    sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(checkoutForm));
    // Sales receipt (and any product follow-up emails) are queued
    // server-side when the order saves (pre-prod #1) - no client mail
    // write here any more.
    this.currentStep = 'confirm';
    this.router.navigateByUrl('/checkout-success');
  }

}
