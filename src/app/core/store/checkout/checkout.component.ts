import { WebConfigModel } from './../../../../../impactdisciplescommon/src/models/utils/web-config.model';
import { WebConfigService } from './../../../../../impactdisciplescommon/src/services/data/web-config.service';
import { SalesService } from './../../../../../impactdisciplescommon/src/services/data/sales.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxFormComponent } from 'devextreme-angular';
import { Timestamp } from 'firebase/firestore';
import { CheckoutForm } from 'impactdisciplescommon/src/models/utils/cart.model';
import { CouponModel } from 'impactdisciplescommon/src/models/utils/coupon.model';
import { CouponService } from 'impactdisciplescommon/src/services/data/coupon.service';
import { ShippingService } from 'impactdisciplescommon/src/services/data/shipping.service';
import { TaxRateService } from 'impactdisciplescommon/src/services/utils/tax-rate.service';
import { EnumHelper } from 'impactdisciplescommon/src/utils/enum_helper';
import { NumberUtil } from 'impactdisciplescommon/src/utils/number-util';
import { Subject } from 'rxjs';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { PurchasesService } from 'impactdisciplescommon/src/services/data/purchases.service';
import { SaleModel } from 'impactdisciplescommon/src/models/utils/sale.model';
import { EMailService } from 'impactdisciplescommon/src/services/data/email.service';
import { IClientAuthorizeCallbackData, ICreateOrderRequest, IPayPalConfig, IPurchaseUnit, ITransactionItem, IUnitAmount, IUnitBreakdown } from 'ngx-paypal';
import notify from 'devextreme/ui/notify';

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


  isSetupPanelVisible: boolean = false;
  showEstimatedTaxesSpinner: boolean = false;
  showShippingSpinner: boolean = false;
  isPayButtonVisible: boolean = false;

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
    private router: Router) {}

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
        if(this.shippingFormComponent.instance.validate().isValid) {
          this.isShippingView = false;
          this.isBillingView = true;
          this.isSetupPanelVisible = true;

          let promises = [];

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
          this.checkoutForm.shippingDiscount = sale.percentOff / 100 * this.checkoutForm.shippingRate;

          this.checkoutForm.shippingDiscountReason = sale.percentOff + "% Off"
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
    let total = (isNaN(this.calculateSubTotal()) ? 0 : this.calculateSubTotal())
      - (isNaN(this.calculateTotalDiscount()) ? 0 :  this.calculateTotalDiscount())
      + (isNaN(this.checkoutForm.estimatedTaxes) ? 0 :  this.checkoutForm.estimatedTaxes)
      + (isNaN(this.checkoutForm.shippingRate) ? 0 :  this.checkoutForm.shippingRate)
      - (isNaN(this.checkoutForm.shippingDiscount) ? 0 :  this.checkoutForm.shippingDiscount);

    return total
  }

  isShippingAddressNeeded(){
    let shippingNotRequired = this.checkoutForm.cartItems.map(item => item.isEBook || item.isEvent || item.isDigitalBook).every(Boolean)

    return !shippingNotRequired
  }

  private createPaypalConfig(){
    let itemTotal = this.checkoutForm.cartItems.map(item => {
      let p = item.salePrice ? item.salePrice : item.price;

      return p * item.orderQuantity;
    }).reduce((a,b) => a + b);

    let itemUnitTotal: IUnitAmount = {
      currency_code: this.currency,
      value: this.calculateSubTotal().toFixed(2).toString()
    }

    let discountTotal: IUnitAmount = {
      currency_code: this.currency,
      value: this.calculateTotalDiscount()?.toFixed(2).toString()
    }

    let shippingTotal: IUnitAmount = {
      currency_code: this.currency,
      value: this.checkoutForm.shippingRate.toFixed(2).toString()
    }

    let shippingDiscountTotal: IUnitAmount = {
      currency_code: this.currency,
      value: (itemTotal > this.webConfig.freeShippingAmount ? this.checkoutForm.shippingRate : 0).toFixed(2).toString()
    }

    let taxesTotal: IUnitAmount = {
      currency_code: this.currency,
      value: this.checkoutForm.estimatedTaxes?.toFixed(2).toString()
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
      value: this.calculateOrderTotal().toFixed(2).toString(),
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
      clientId: this.webConfig.paypalClientId,
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
          notify({
            message: "There was an error processing the Paypal Transaction",
            position: 'top',
            width: 600,
            type: 'error'
          });
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

    this.purchasesService.add(this.checkoutForm).then(cart => {
      localStorage.setItem('checkoutForm', JSON.stringify(this.checkoutForm));

      this.sendProductPurchaseSuccessEmail(this.checkoutForm);

      this.router.navigate(['/checkout-success'], { queryParams: { savedForm: this.checkoutForm.id }});
    })
  }

  sendProductPurchaseSuccessEmail(cart: CheckoutForm){
    let ebooksPurchased = false;
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

      if(product.isDigitalBook){
        ebooksPurchased = true;
        html += "<td style='text-align: left;'>See install instuctions below!</td>";
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

    let form = {};
    form['firstName'] = cart.firstName;
    form['lastName'] = cart.lastName;
    form['email'] = cart.email;
    form['product_list'] = html;


    return this.emailService.sendHTMLEMailFromTemplate(cart.email, "Sales Receipt", form);
  }
}
