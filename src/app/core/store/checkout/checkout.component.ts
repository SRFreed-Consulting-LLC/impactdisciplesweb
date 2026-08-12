import { WebConfigModel } from './../../../../../src/app/common/models/utils/web-config.model';
import { WebConfigService } from './../../../../../src/app/common/services/data/web-config.service';
import { SalesService } from './../../../../../src/app/common/services/data/sales.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { CheckoutForm } from 'src/app/common/models/utils/cart.model';
import { CouponModel } from 'src/app/common/models/utils/coupon.model';
import { CouponService } from 'src/app/common/services/data/coupon.service';
import { ShippingService } from 'src/app/common/services/data/shipping.service';
import { TaxRateService } from 'src/app/common/services/utils/tax-rate.service';
import { EnumHelper } from 'src/app/common/utils/enum_helper';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { Subject } from 'rxjs';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { PurchasesService } from 'src/app/common/services/data/purchases.service';
import { SaleModel } from 'src/app/common/models/utils/sale.model';
import { EMailService } from 'src/app/common/services/data/email.service';
import { LoggerService } from 'src/app/common/services/data/logger.service';
import { IClientAuthorizeCallbackData, ICreateOrderRequest, IPayPalConfig, ITransactionItem, IUnitAmount, IUnitBreakdown } from 'ngx-paypal';
import { ToastService } from 'src/app/shared/utils/services/toast.service';

@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.component.html',
    styleUrls: ['./checkout.component.scss'],
    standalone: false
})
export class CheckoutComponent implements OnInit, OnDestroy {
  // Replaces DxForm's [formData]="checkoutForm" two-way binding + the
  // #shippingFormComponent ViewChild's .instance.validate().isValid gate.
  // Two groups (not one) so shippingAddressForm's required validators can
  // be skipped entirely when isShippingAddressNeeded() is false -- matches
  // the old *ngIf'd dxi-item group, which meant DevExtreme never validated
  // those fields at all for e-book/digital-only orders.
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

  checkoutForm: CheckoutForm = {... new CheckoutForm()};
  couponCode = '';
  itemDiscountAmount: CouponModel;
  cartDiscountAmount: CouponModel;
  items = [];

  isShippingView = false;
  isBillingView = false;
  states: string[] = EnumHelper.getStateTypesAsArray();;
  countries: string[] = EnumHelper.getCountryTypesAsArray();

  sales: SaleModel[] = [];
  webConfig: WebConfigModel;

  NumberUtil = NumberUtil;


  isSetupPanelVisible = false;
  showEstimatedTaxesSpinner = false;
  showShippingSpinner = false;
  isPayButtonVisible = false;

  private ngUnsubscribe = new Subject<void>();

  public payPalConfig?: IPayPalConfig;

  currency = 'USD';

  constructor(
    public cartService: CartService,
    private purchasesService: PurchasesService,
    private couponService: CouponService,
    private shippingService: ShippingService,
    private taxService: TaxRateService,
    private emailService: EMailService,
    private salesService: SalesService,
    private webConfigService: WebConfigService,
    private router: Router,
    private toastService: ToastService,
    private loggerService: LoggerService,
    private fb: FormBuilder) {}

  async ngOnInit(): Promise<void> {
    this.setView();
    this.getDefaultCheckOutForm()
    this.getActiveSales();
    this.getCouponCode();
    this.getWebConfig();
  }

  setView(view?: string){
    switch(view) {
      case 'shipping':
        this.isShippingView = true;
        this.isBillingView = false;
        break;
      case 'billing':
        this.customerForm.markAllAsTouched();
        if (this.isShippingAddressNeeded()) {
          this.shippingAddressForm.markAllAsTouched();
        }

        if(this.customerForm.valid && (!this.isShippingAddressNeeded() || this.shippingAddressForm.valid)) {
          this.applyFormValuesToCheckoutForm();

          this.isShippingView = false;
          this.isBillingView = true;
          this.isSetupPanelVisible = true;

          const promises = [];

          promises.push(this.calculateShippingCost());
          promises.push(this.calculateEstimatedTax());

          Promise.all(promises).then(() => {
            if(this.calculateOrderTotal() > 0){
              this.createPaypalConfig();
            } else {
              console.log('no paypal needed');
              this.submitRequest();
            }


            this.showEstimatedTaxesSpinner = false;
            this.showShippingSpinner = false;

            this.isSetupPanelVisible = false;
          })
        }
        break;
      default:
        this.isShippingView = true;
        this.isBillingView = false;
        break;
    }
  }

  // Replaces DxForm's [formData]="checkoutForm" in-place two-way binding --
  // that DevExtreme feature wrote every keystroke straight into
  // checkoutForm's own nested fields, which the billing-view recap and
  // every calculate*()/submitRequest() method below reads directly.
  // Reactive Forms don't do that automatically, so this copies the two
  // FormGroups' values across once, at the exact point the old validate()
  // gate used to run (the transition to billing) -- everything downstream
  // keeps working unmodified against checkoutForm.
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

  calculateEstimatedTax = async () => {
    if(this.calculateSubTotal() > 0 && this.checkoutForm.shippingAddress.state == 'Georgia'){
      this.showEstimatedTaxesSpinner = true;

      this.checkoutForm = await this.taxService.calculateTaxRate(this.checkoutForm);
    } else {
      this.checkoutForm.estimatedTaxes = 0;
    }
  }

  calculateShippingCost = async () => {
    this.showShippingSpinner = true;

    this.checkoutForm = await this.shippingService.calculateShipping(this.checkoutForm);

    if(this.calculateSubTotal() > this.webConfig.freeShippingAmount){
      this.checkoutForm.shippingDiscount = this.checkoutForm.shippingRate;

      this.checkoutForm.shippingDiscountReason = "Over $" + this.webConfig.freeShippingAmount;
    } else {
      this.sales.forEach(sale => {
        if(sale.isShipping){
          const percentOff = NumberUtil.clampPercent(sale.percentOff);
          this.checkoutForm.shippingDiscount = percentOff / 100 * this.checkoutForm.shippingRate;

          this.checkoutForm.shippingDiscountReason = percentOff + "% Off"
        }
      })
    }
  }

  calculateSubTotal(){
    return this.checkoutForm.cartItems.map(item => (item.salePrice ? item.salePrice : item.price) * item.orderQuantity).reduce((a,b) => a+ b);
  }

  calculateTotalDiscount(){
    return this.checkoutForm.cartItems.map(item => item.discount ? item.discount * item.orderQuantity : 0).reduce((a,b) => a+ b);
  }

  calculateOrderTotal(){
    const total = (isNaN(this.calculateSubTotal()) ? 0 : this.calculateSubTotal())
      - (isNaN(this.calculateTotalDiscount()) ? 0 :  this.calculateTotalDiscount())
      + (isNaN(this.checkoutForm.estimatedTaxes) ? 0 :  this.checkoutForm.estimatedTaxes)
      + (isNaN(this.checkoutForm.shippingRate) ? 0 :  this.checkoutForm.shippingRate)
      - (isNaN(this.checkoutForm.shippingDiscount) ? 0 :  this.checkoutForm.shippingDiscount);

    return total
  }

  isShippingAddressNeeded(){
    const shippingNotRequired = this.checkoutForm.cartItems.map(item => item.isEBook || item.isEvent || item.isDigitalBook).every(Boolean)

    return !shippingNotRequired
  }

  private createPaypalConfig(){
    const itemTotal = this.checkoutForm.cartItems.map(item => {
      const p = item.salePrice ? item.salePrice : item.price;

      return p * item.orderQuantity;
    }).reduce((a,b) => a + b);

    const itemUnitTotal: IUnitAmount = {
      currency_code: this.currency,
      value: this.calculateSubTotal().toFixed(2).toString()
    }

    const discountTotal: IUnitAmount = {
      currency_code: this.currency,
      value: this.calculateTotalDiscount()?.toFixed(2).toString()
    }

    const shippingTotal: IUnitAmount = {
      currency_code: this.currency,
      value: this.checkoutForm.shippingRate.toFixed(2).toString()
    }

    const shippingDiscountTotal: IUnitAmount = {
      currency_code: this.currency,
      value: (itemTotal > this.webConfig.freeShippingAmount ? this.checkoutForm.shippingRate : 0).toFixed(2).toString()
    }

    const taxesTotal: IUnitAmount = {
      currency_code: this.currency,
      value: this.checkoutForm.estimatedTaxes?.toFixed(2).toString()
    }

    const breakdown: IUnitBreakdown = {
      item_total: itemUnitTotal,
      shipping: shippingTotal,
      shipping_discount: shippingDiscountTotal,
      tax_total: taxesTotal,
      discount: discountTotal
    }


    const amount: IUnitAmount = {
      currency_code: this.currency,
      value: this.calculateOrderTotal().toFixed(2).toString(),
      breakdown: breakdown
    }

    const items: ITransactionItem[] = this.checkoutForm.cartItems.map(item => ({
      name: item.itemName,
      quantity: item.orderQuantity.toString(),
      category: 'DIGITAL_GOODS',
      unit_amount: {
        currency_code: this.currency,
        value: (item.salePrice ? item.salePrice : item.price).toFixed(2).toString()
      },
    } as ITransactionItem))

    this.payPalConfig = {
      currency: this.currency,
      clientId: this.webConfig.paypalClientId,
      createOrderOnClient: () => ({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: amount,
              items: items
            }
          ]
        } as ICreateOrderRequest),
        advanced: {
          commit: 'true',
        },
        style: {
          label: 'paypal',
          layout: 'vertical',
          color:'blue',
          shape: 'rect',
        },
        onApprove: () => {
          // Note: intentionally not logging order details here -- they
          // carry buyer PII (name, address, payer email) and shouldn't land
          // in the browser console in production.
        },
        onClientAuthorization: (data) => {
          this.submitRequest(data);
        },
        onCancel: () => {},
        onError: () => {
          this.toastService.notify({ message: "There was an error processing the Paypal Transaction", type: 'error' });
        },
        onClick: () => {},
    };
  }

  private getDefaultCheckOutForm() {
    // history.state.data is only set when navigating in from the shopping
    // cart page's own router.navigate(['/checkout'], { state: { data: ... }})
    // call (see shopping-cart.component.ts). Direct navigation -- a
    // bookmark, a page refresh, browser back/forward -- leaves history.state
    // without a .data property at all, which used to throw here (reading
    // .couponCode off undefined) and, because this method never got to
    // assign this.checkoutForm, cascaded into a second crash on first
    // render (calculateSubTotal() calling .map() on the still-undefined
    // cartItems of the class-field default). Pre-existing bug, fixed here
    // as part of removing DevExtreme from this component -- unrelated to
    // that migration itself, but found while verifying it.
    const navigationData = history.state?.data;
    this.checkoutForm = {
      cartItems: this.cartService.getCartProducts(),
      shippingDiscount: 0,
      couponCode: navigationData?.couponCode ? navigationData.couponCode : '',
      isShippingSameAsBilling: true,
      isNewsletter: true,
      billingAddress: { state: '', country: 'United States'},
      shippingAddress: { state: '' , country: 'United States'}
    }
  }

  private getWebConfig() {
    this.webConfigService.getAll().then(config => {
      this.webConfig = config[0];
    })
  }

  private getCouponCode() {
    if(this.checkoutForm.couponCode) {
      this.couponService.getAllByValue('code', this.checkoutForm.couponCode).then(coupons => {
        if (coupons.length > 0 && coupons[0].isActive) {
          this.cartDiscountAmount = coupons[0]
        }
      })
    }
  }

  private getActiveSales() {
    this.salesService.getAllByValue("isActive", true).then(sales => {
      const today = new Date();

      sales.forEach(sale => {
        const startDate = new Date(sale.startDate as string)
        const endDate = new Date(sale.endDate as string)

        if(startDate <= today && endDate >= today){
          this.sales.push(sale);
        }
      })
    })
  }

  setLoading(isLoading) {
    if (isLoading) {
      // Disable the button and show a spinner
      document.querySelector("#submit")['disabled'] = true;
      document.querySelector("#spinner").classList.remove("hidden");
      document.querySelector("#button-text").classList.add("hidden");
    } else {
      document.querySelector("#submit")['disabled'] = false;
      document.querySelector("#spinner").classList.add("hidden");
      document.querySelector("#button-text").classList.remove("hidden");
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  submitRequest(data?: IClientAuthorizeCallbackData){
    if(data){
      this.checkoutForm.payPalReceipt = data;
      this.checkoutForm.receipt = data.id;
    } else {
      if(this.checkoutForm.couponCode){
        this.checkoutForm.receipt = 'COUPON';
      } else {
        this.checkoutForm.receipt = "FREE ONLY"
      }
    }
    this.checkoutForm.discount = this.calculateTotalDiscount()
    this.checkoutForm.total = this.calculateSubTotal();

    this.checkoutForm.processedStatus = "NEW";
    this.checkoutForm.dateProcessed = Timestamp.now();

    this.checkoutForm.cartItems.forEach(item => {
      item.dateProcessed = Timestamp.now();
      item.processedStatus = "NEW"
      item.price = item.price && NumberUtil.isNumber(item.price)? item.price : 0;
    })

    this.purchasesService.add(this.checkoutForm).then(() => {
      localStorage.setItem('checkoutForm', JSON.stringify(this.checkoutForm));

      this.sendProductPurchaseSuccessEmail(this.checkoutForm);

      this.router.navigate(['/checkout-success'], { queryParams: { savedForm: this.checkoutForm.id }});
    }).catch((err) => {
      // Runs after payment (PayPal or a $0/coupon order) has already been
      // finalized - a failure here means the customer was charged (or their
      // free order was accepted) but no purchase record was saved, so this
      // must never fail silently. Log it (gives a support reference code)
      // and tell the customer plainly that payment went through rather than
      // implying the order itself failed - see item #10 of the 2026-08-12
      // fullsweep fix-first pass.
      this.setLoading(false);

      this.loggerService.logMessage(
        'CHECKOUT',
        this.checkoutForm.email,
        'Failed to save purchase after payment was captured/finalized.',
        { err, receipt: this.checkoutForm.receipt, payPalReceiptId: this.checkoutForm.payPalReceipt?.id }
      ).subscribe((errorCode) => {
        this.toastService.notify({
          message: 'Your payment went through, but we hit a problem saving your order. ' +
            'Please contact us so we can complete it manually - reference code: ' + errorCode +
            (this.checkoutForm.payPalReceipt?.id ? ' (payment ref: ' + this.checkoutForm.payPalReceipt.id + ')' : ''),
          type: 'error'
        });
      });
    })
  }

  sendProductPurchaseSuccessEmail(cart: CheckoutForm){
    let ebooksPurchased = false;
    const USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    let html = "<table style='width: 90%;'>";
    html +="<tr><td></td><td style='text-align: left;'>PRODUCT</td><td style='text-align: right;'>PRICE</td><td style='text-align: right;'>DISCOUNT</td><td style='text-align: center;'>QUANTITY</td><td style='text-align: right;'>TOTAL</td><td style='text-align: left;'></td></tr>";

    cart.cartItems.forEach(product => {
      html+="<tr>"
      html+="<td><img src='" +product.img.url+ "' alt='"+product.img.name+"' height='100px'></img></td>"
      html+="<td style='text-align: left;'>" +product.itemName+ "</td>"
      html+="<td style='text-align: right;'>" +USDollar.format(product.price)+ "</td>"

      if(product.salePrice > 0 || product.discountPrice > 0){
        html+="<td style='text-align: right;'>" + USDollar.format((product.price - (product.salePrice ? product.salePrice : product.discountPrice)))+ "</td>"
      } else {
        html+="<td></td>"
      }

      html+="<td style='text-align: center;'>" + product.orderQuantity+ "</td>"

      html+="<td style='text-align: right;'>" + USDollar.format(product.orderQuantity * (product.salePrice? product.salePrice : product.discountPrice? product.discountPrice : product.price))+ "</td>"

      if(product.isEBook){
        html += "<td style='text-align: left;'><a href='"+ product.eBookUrl.url+"' download>DOWNLOAD</a></td>";
      }

      if(product.isDigitalBook){
        ebooksPurchased = true;
        html += "<td style='text-align: left;'>See install instuctions below!</td>";
      }
      html+="</tr>"
    })

    const subtotal = cart.cartItems.map(item => item.price * item.orderQuantity).reduce((a,b)=> a + b);

    html +="<tr><td></td><td></td><td></td><td></td><td>SUBTOTAL</td><td style='text-align: right;'><b>"+ USDollar.format(subtotal) +"</b></td><td></td></tr>";

    if(cart.estimatedTaxes > 0){
      html +="<tr><td></td><td></td><td></td><td></td><td>TAXES</td><td style='text-align: right;'><b> + "+ USDollar.format(cart.estimatedTaxes) +"</b></td><td></td></tr>";
    }

    if(cart.shippingRate > 0){
      html +="<tr><td></td><td></td><td></td><td></td><td>SHIPPING</td><td style='text-align: right;'><b> + "+ USDollar.format(cart.shippingRate) +"</b></td><td></td></tr>";
    }

    if(cart.shippingDiscount > 0){
      html +="<tr><td></td><td></td><td></td><td></td><td>SHIPPINGDISCOUNT</td><td style='text-align: right;'><b> - "+ USDollar.format(cart.shippingDiscount) +"</b></td><td></td></tr>";
    }

    if(cart.discount > 0) {
      html +="<tr><td></td><td></td><td></td><td></td><td>DISCOUNT</td><td style='text-align: right;'><b> - "+ USDollar.format(cart.discount) +"</b></td><td></td></tr>";
    }

    html +="<tr><td></td><td></td><td></td><td></td><td>TOTAL</td><td style='text-align: right;'><b> = "+ USDollar.format(this.calculateOrderTotal()) +"</b></td><td></td></tr>";

    html+="</table>"

    if(cart.receipt){
      html += '<div>Confirmation Id: <b>' + cart.receipt + '</b></div>'
    }

    if(ebooksPurchased){
      html += '<br><div><b>If you purchased an item from our Digital Library, instuctions for setting up the Library on your preferred Device can be found <a href="https://library.impactdisciples.com/install-instructions">here</a>!</b></div>'
      html += '<br><div>(For easy installation, it is best to open this email on your preferred Device and click the link!)</div>'
    }

    const form = {};
    form['firstName'] = cart.firstName;
    form['lastName'] = cart.lastName;
    form['email'] = cart.email;
    form['product_list'] = html;


    return this.emailService.sendHTMLEMailFromTemplate(cart.email, "Sales Receipt", form);
  }
}
