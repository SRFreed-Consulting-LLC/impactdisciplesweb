import { WebConfigModel } from './../../../../../impactdisciplescommon/src/models/utils/web-config.model';
import { WebConfigService } from './../../../../../impactdisciplescommon/src/services/data/web-config.service';
import { SalesService } from './../../../../../impactdisciplescommon/src/services/data/sales.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, ofActionDispatched } from '@ngxs/store';
import { DxFormComponent } from 'devextreme-angular';
import { Timestamp } from 'firebase/firestore';
import { CustomerModel } from 'impactdisciplescommon/src/models/domain/utils/customer.model';
import { CheckoutForm } from 'impactdisciplescommon/src/models/utils/cart.model';
import { CouponModel } from 'impactdisciplescommon/src/models/utils/coupon.model';
import { UserAuthenticated } from 'impactdisciplescommon/src/services/actions/authentication.actions';
import { CouponService } from 'impactdisciplescommon/src/services/data/coupon.service';
import { ShippingService } from 'impactdisciplescommon/src/services/data/shipping.service';
import { TaxRateService } from 'impactdisciplescommon/src/services/utils/tax-rate.service';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { StripeService } from 'impactdisciplescommon/src/services/utils/stripe.service';
import { EnumHelper } from 'impactdisciplescommon/src/utils/enum_helper';
import { NumberUtil } from 'impactdisciplescommon/src/utils/number-util';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { environment } from 'src/environments/environment';
import { PurchasesService } from 'impactdisciplescommon/src/services/data/purchases.service';
import { SaleModel } from 'impactdisciplescommon/src/models/utils/sale.model';
import { EMailService } from 'impactdisciplescommon/src/services/data/email.service';
import { IClientAuthorizeCallbackData, ICreateOrderRequest, IPayPalConfig, IPurchaseUnit, ITransactionItem, IUnitAmount, IUnitBreakdown } from 'ngx-paypal';
import { EMailModel } from 'impactdisciplescommon/src/models/admin/mail.model';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  @ViewChild('shippingFormComponent', { static: false }) shippingFormComponent: DxFormComponent;
  @ViewChild('billingFormComponent', { static: false }) billingFormComponent: DxFormComponent;

  checkoutForm: CheckoutForm = {... new CheckoutForm()};
  couponCode: string = '';
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

  totalShippingWeight: number = 0;

  isSetupPanelVisible: boolean = false;
  showEstimatedTaxesSpinner: boolean = false;
  showShippingSpinner: boolean = false;
  isPayButtonVisible: boolean = false;

  private ngUnsubscribe = new Subject<void>();

  public payPalConfig?: IPayPalConfig;

  currency = 'USD';
  subtotal: number = 0;
  totalDiscount: number = 0;
  estimatedTaxes: number = 0;
  shippingRate: number = 0;
  shippingDiscount: number = 0;
  shippingDiscountReason: string ="";

  constructor(
    public cartService: CartService,
    private stripeService: StripeService,
    private purchasesService: PurchasesService,
    private couponService: CouponService,
    private shippingService: ShippingService,
    private toastrService: ToastrService,
    private taxService: TaxRateService,
    private emailService: EMailService,
    private salesService: SalesService,
    private webConfigService: WebConfigService,
    private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.setView();
    this.getDefaultCheckOutForm()
    this.getActiveSales();
    this.getCouponCode();
    this.getWebConfig();
    this.settleCart();
  }

  setView(view?: string){
    switch(view) {
      case 'shipping':
        this.isShippingView = true;
        this.isBillingView = false;
        break;
      case 'billing':
        if(this.shippingFormComponent.instance.validate().isValid) {
          this.isShippingView = false;
          this.isBillingView = true;
          this.isSetupPanelVisible = true;

          let promises = [];

          promises.push(this.calculateShippingCost());
          promises.push(this.calculateEstimatedTax());

          Promise.all(promises).then(() => {
            this.createPaypalConfig();

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

  calculateEstimatedTax = async () => {
    if(this.getOrderTotal() > 0 && this.checkoutForm.shippingAddress.state == 'Georgia'){
      this.showEstimatedTaxesSpinner = true;

      this.checkoutForm = await this.taxService.calculateTaxRate(this.checkoutForm);

      this.estimatedTaxes = this.checkoutForm.estimatedTaxes;
    } else {
      this.estimatedTaxes = 0;
    }
  }

  calculateShippingCost = async () => {
    this.showShippingSpinner = true;

    this.checkoutForm = await this.shippingService.calculateShipping(this.checkoutForm);

    this.shippingRate =this.checkoutForm.shippingRate;

    if(this.subtotal > this.webConfig.freeShippingAmount){
      this.shippingDiscount = this.checkoutForm.shippingRate;

      this.shippingDiscountReason = "Over $" + this.webConfig.freeShippingAmount;
    } else {
      this.sales.forEach(sale => {
        if(sale.isShipping){
          this.shippingDiscount = sale.percentOff / 100 * this.checkoutForm.shippingRate;

          this.shippingDiscountReason = sale.percentOff + "% Off"
        }
      })
    }
  }

  private settleCart(){
    this.subtotal =  this.checkoutForm.cartItems.map(item => item.price * item.orderQuantity).reduce((a,b) => a+ b);

    this.totalDiscount =  this.checkoutForm.cartItems.map(item => item.discount ? item.discount * item.orderQuantity : 0).reduce((a,b) => a+ b);

    this.totalShippingWeight = this.checkoutForm.cartItems.map(item => item.weight ? item.weight : 0).reduce((a,b) => a+ b);
  }

  isShippingAddressNeeded(){
    let shippingNotRequired = this.checkoutForm.cartItems.map(item => item.isEBook || item.isEvent).every(Boolean)

    return !shippingNotRequired
  }

  private createPaypalConfig(){
    let itemTotal = this.checkoutForm.cartItems.map(item => {
      let p = item.salePrice ? item.salePrice : item.price;

      return p * item.orderQuantity;
    }).reduce((a,b) => a + b);

    let itemUnitTotal: IUnitAmount = {
      currency_code: this.currency,
      value: itemTotal.toFixed(2).toString()
    }

    let discountTotal: IUnitAmount = {
      currency_code: this.currency,
      value: this.totalDiscount?.toFixed(2).toString()
    }

    let shippingTotal: IUnitAmount = {
      currency_code: this.currency,
      value: this.shippingRate.toFixed(2).toString()
    }

    let shippingDiscountTotal: IUnitAmount = {
      currency_code: this.currency,
      value: (itemTotal > this.webConfig.freeShippingAmount ? this.shippingRate : 0).toFixed(2).toString()
    }

    let taxesTotal: IUnitAmount = {
      currency_code: this.currency,
      value: this.estimatedTaxes.toFixed(2).toString()
    }

    let breakdown: IUnitBreakdown = {
      item_total: itemUnitTotal,
      shipping: shippingTotal,
      shipping_discount: shippingDiscountTotal,
      tax_total: taxesTotal,
      discount: discountTotal
    }


    let amount: IUnitAmount = {
      currency_code: this.currency,
      value: this.getOrderTotal().toFixed(2).toString(),
      breakdown: breakdown
    }

    let items: ITransactionItem[] = this.checkoutForm.cartItems.map(item => <ITransactionItem>{
      name: item.itemName,
      quantity: item.orderQuantity.toString(),
      category: 'DIGITAL_GOODS',
      unit_amount: {
        currency_code: this.currency,
        value: (item.salePrice ? item.salePrice : item.price).toFixed(2).toString()
      },
    })

    this.payPalConfig = {
      currency: this.currency,
      clientId: 'AV50zoOW01VnMjSFor9aKf22aWVCz_p_3jsJIx0Co9j5GnaZenMZ3UXPRyxxOHPNAdRR97dHAKvSdiXS',
      createOrderOnClient: (data) => <ICreateOrderRequest> {
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: amount,
              items: items
            }
          ]
        },
        advanced: {
          commit: 'true',
        },
        style: {
          label: 'paypal',
          layout: 'vertical',
          color:'blue',
          shape: 'rect',
        },
        onApprove: (data, actions) => {
          console.log('onApprove - transaction was approved, but not authorized', data, actions);
          actions.order.get().then(details => {
            console.log('onApprove - you can get full order details inside onApprove: ', details);
          });
        },
        onClientAuthorization: (data) => {
          console.log(data)

          this.submitRequest(data);
        },
        onCancel: (data, actions) => {
          console.log('OnCancel', data, actions);
        },
        onError: err => {
          this.toastrService.error("There was an error processing the Paypal Transaction")
          console.log('OnError', err);
        },
        onClick: (data, actions) => {
          console.log('onClick', data, actions);
        },
    };
  }

  private getDefaultCheckOutForm() {
    this.checkoutForm = {
      cartItems: this.cartService.getCartProducts(),
      shippingDiscount: 0,
      couponCode: history.state.data.couponCode? history.state.data.couponCode : '',
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
      let today = new Date();

      sales.forEach(sale => {
        let startDate = new Date(sale.startDate as string)
        let endDate = new Date(sale.endDate as string)

        if(startDate <= today && endDate >= today){
          this.sales.push(sale);
        }
      })
    })
  }

  getOrderTotal(){
    return this.subtotal - this.totalDiscount + this.estimatedTaxes + this.shippingRate - this.shippingDiscount;
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
    this.checkoutForm.payPalReceipt = data;
    this.checkoutForm.total = this.subtotal;
    this.checkoutForm.discount = this.totalDiscount;
    this.checkoutForm.estimatedTaxes = this.estimatedTaxes;
    this.checkoutForm.shippingRate = this.shippingRate;
    this.checkoutForm.shippingDiscount = this.shippingDiscount;

    if(this.checkoutForm.payPalReceipt){
      if(this.checkoutForm.couponCode){
        this.checkoutForm.receipt = 'COUPON';
      } else {
        this.checkoutForm.receipt = "FREE ONLY"
      }
    }

    this.checkoutForm.processedStatus = "NEW";
    this.checkoutForm.dateProcessed = Timestamp.now();

    this.checkoutForm.cartItems.forEach(item => {
      item.dateProcessed = Timestamp.now();
      item.processedStatus = "NEW"
      item.price = item.price && NumberUtil.isNumber(item.price)? item.price : 0;
    })

    this.checkoutForm.receipt = data.id;

    localStorage.setItem('checkoutForm', JSON.stringify(this.checkoutForm));

    this.purchasesService.add(this.checkoutForm);

    this.sendProductPurchaseSuccessEmail(this.checkoutForm);

    this.router.navigate(['/checkout-success'], { queryParams: { savedForm: this.checkoutForm.id }});
  }

  sendProductPurchaseSuccessEmail(cart: CheckoutForm){
    let USDollar = new Intl.NumberFormat('en-US', {
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
      html+="</tr>"
    })

    let subtotal = cart.cartItems.map(item => item.price * item.orderQuantity).reduce((a,b)=> a + b);

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

    if(cart.discount) {
      html +="<tr><td></td><td></td><td></td><td></td><td>DISCOUNT</td><td style='text-align: right;'><b> - "+ USDollar.format(cart.discount) +"</b></td><td></td></tr>";
    }

    html +="<tr><td></td><td></td><td></td><td></td><td>TOTAL</td><td style='text-align: right;'><b> = "+ USDollar.format(this.getOrderTotal()) +"</b></td><td></td></tr>";

    html+="</table>"

    if(cart.receipt){
      html += '<div>Confirmation Id: <b>' + cart.receipt + '</b></div>'
    }

    let form = {};
    form['firstName'] = cart.firstName;
    form['lastName'] = cart.lastName;
    form['email'] = cart.email;
    form['product_list'] = html;


    return this.emailService.sendHTMLEMailFromTemplate(cart.email, "Sales Receipt", form);
  }

}
