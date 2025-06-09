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
  paymentIntent: string;
  elements;
  items = [];

  isLoggedIn = false;
  loggedInUser: string = '';
  password: string = '';

  isShippingView = false;
  isBillingView = false;
  states: string[];
  countries: string[];

  sales: SaleModel[] = [];
  webConfig: WebConfigModel;

  NumberUtil = NumberUtil;

  totalShippingWeight: number = 0;

  showEstimatedTaxesSpinner: boolean = false;
  showShippingSpinner: boolean = false;
  isProcessingPanelVisible: boolean = false;
  isSetupPanelVisible: boolean = false;
  isPayButtonVisible: boolean = false;

  private ngUnsubscribe = new Subject<void>();

  constructor(
    public cartService: CartService,
    private stripeService: StripeService,
    private purchasesService: PurchasesService,
    private couponService: CouponService,
    private shippingService: ShippingService,
    private authService: AuthService,
    private toastrService: ToastrService,
    private taxService: TaxRateService,
    private emailService: EMailService,
    private salesService: SalesService,
    private webConfigService: WebConfigService,
    private actions$: Actions,
    private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.setView();
    this.getActiveSales();
    this.getWebConfig();

    const shoppingCart = history.state.data;

    this.states = EnumHelper.getStateTypesAsArray();
    this.countries = EnumHelper.getCountryTypesAsArray()

    this.actions$.pipe(
      ofActionDispatched(UserAuthenticated),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(({ user }: UserAuthenticated) => {
      this.loggedInUser = `${user.firstName} ${user.lastName}`
      this.isLoggedIn = true
    })

    this.checkoutForm = {
      cartItems: this.cartService.getCartProducts(),
      shippingDiscount: 0,
      couponCode: shoppingCart.couponCode? shoppingCart.couponCode : '',
      isShippingSameAsBilling: true,
      isNewsletter: true,
      billingAddress: { state: '', country: 'United States'},
      shippingAddress: { state: '' , country: 'United States'}
    }

    if(this.checkoutForm.couponCode) {
      this.couponService.getAllByValue('code', this.checkoutForm.couponCode).then(coupons => {
        if (coupons.length > 0 && coupons[0].isActive) {
          this.cartDiscountAmount = coupons[0]
        }
      })
    }

    this.settleCart();

    this.authService.getUser().pipe(takeUntil(this.ngUnsubscribe)).subscribe((user) => {
      if(user) {
        this.isLoggedIn = true;
        this.loggedInUser = `${user.firstName} ${user.lastName}`
        this.checkoutForm = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: (user  as CustomerModel).phone,
          // TODO: Need to change to use saved addresses in user account
          billingAddress: (user as CustomerModel).billingAddress || null,
          shippingAddress: this.checkoutForm.isShippingSameAsBilling ? (user as CustomerModel).billingAddress : null,
          ...this.checkoutForm
        }
      }
    });
  }

  getActiveSales() {
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

  getWebConfig(){
    this.webConfigService.getAll().then(config => {
      this.webConfig = config[0];
    })
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

          if(this.checkoutForm.total > 0 && this.checkoutForm.shippingAddress.state == 'Georgia'){
            promises.push(this.calculateEstimatedTax());
          } else {
            this.checkoutForm.estimatedTaxes = 0;
          }

          Promise.all(promises).then(() => {
            this.stripeService.cancelStripeIntent(this.paymentIntent).then(() => {
              this.showEstimatedTaxesSpinner = false;
              this.showShippingSpinner = false;
              this.toggleForm();
            });
          })
        }
        break;
      default:
        this.isShippingView = true;
        this.isBillingView = false;
        break;
    }
  }


  calculateShippingCost = async () => {
    this.showShippingSpinner = true;

    this.checkoutForm = await this.shippingService.calculateShipping(this.checkoutForm);

    this.evaluateShippingCost();
  }

  calculateEstimatedTax = async () => {
    this.showEstimatedTaxesSpinner = true;

    this.checkoutForm = await this.taxService.calculateTaxRate(this.checkoutForm);
  }

  evaluateShippingCost(){
    if(this.checkoutForm.totalBeforeDiscount > this.webConfig.freeShippingAmount){
      this.checkoutForm.shippingDiscount = this.checkoutForm.shippingRate;

      this.checkoutForm.total -= this.checkoutForm.shippingDiscount;

      this.checkoutForm.shippingDiscountReason = "Over $" + this.webConfig.freeShippingAmount;
    } else {
      this.sales.forEach(sale => {
        if(sale.isShipping){
          let shippingDiscount = sale.percentOff / 100 * this.checkoutForm.shippingRate;

          this.checkoutForm.shippingDiscount = shippingDiscount;

          this.checkoutForm.total -= this.checkoutForm.shippingDiscount;

          this.checkoutForm.shippingDiscountReason = sale.percentOff + "% Off"
        }
      })
    }
  }

  //PAYMENT METHODS
  async toggleForm(): Promise<void> {
    if(this.checkoutForm.total && NumberUtil.isNumber(this.checkoutForm.total) && this.checkoutForm.total > 0){
      try {
        setTimeout(async () => {
          const paymentForm = document.querySelector("#payment-form");

          if (paymentForm) {
            paymentForm.addEventListener("submit", this.handleSubmit.bind(this));

            this.items = [];

            let description = "Payment from " + this.checkoutForm.firstName + ' ' + this.checkoutForm.lastName + '\n';

            this.cartService.getCartProducts().forEach(product => {
              if(product.price > 0){
                let price = product.price * product.orderQuantity;

                description += product.itemName + " (" + product.orderQuantity + ")   ";
                description += "$" + price.toFixed(2) + "\n";

                this.items.push({id: product.id, name: product.itemName, amount: price * 100});
              }
            })

            if(this.checkoutForm.shippingRate && this.checkoutForm.shippingRate > 0){
              let rate = this.checkoutForm.shippingRate - (this.checkoutForm.shippingDiscount? this.checkoutForm.shippingDiscount : 0);

              description += "Shipping $" + rate.toFixed(2) + "\n";

              this.items.push({id: 'shipping', amount: rate * 100})
            }

            if(this.checkoutForm.estimatedTaxes && this.checkoutForm.estimatedTaxes > 0){
              description += "Taxes $" + this.checkoutForm.estimatedTaxes.toFixed(2) + "\n";

              this.items.push({id: 'taxes', amount: this.checkoutForm.estimatedTaxes * 100})
            }

            if(this.checkoutForm.discount && this.checkoutForm.discount > 0){
              description += "Discount (" + this.checkoutForm.couponCode+ ") -$" + this.checkoutForm.discount.toFixed(2) + "\n";

              this.items.push({id: 'discount', amount: -this.checkoutForm.discount * 100})
            }

            let request = {};
            request['items'] = this.items;
            request['description'] = description;
            request['receipt_email'] = this.checkoutForm.email;

            // Fetch client secret for Stripe payment
            const response = await fetch(environment.stripeURL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(request),
            })

            if (!response.ok) {
              throw new Error('Failed to fetch client secret: ' + JSON.stringify(response));
            }

            const { clientSecret, paymentIntent } = await response.json();

            this.paymentIntent = paymentIntent;

            // Initialize Stripe Elements
            await this.stripeService.getStripe().then(stripe => {
              this.elements = stripe.elements({ clientSecret });

              const paymentElementOptions = {
                layout: "tabs",
              };

              const paymentElement = this.elements.create("payment", paymentElementOptions);
              paymentElement.mount("#payment-element");

              this.isPayButtonVisible = true;
              this.isSetupPanelVisible = false;
            })
          }
        }, 0);  // Ensures form is rendered before Stripe is initialized

      } catch (error) {
        this.toastrService.error('Failed to load payment form. Please try again.', 'ERROR!')
      }
    } else {
      const paymentForm = document.querySelector("#payment-form");

      if(paymentForm){
        paymentForm.remove();
      }

      this.isPayButtonVisible = true;
      this.isSetupPanelVisible = false;
    }
  }

  async handleSubmit(e) {
    if(this.billingFormComponent.instance.validate().isValid) {
      this.isProcessingPanelVisible = true;
      this.checkoutForm.processedStatus = "NEW";
      this.checkoutForm.dateProcessed = Timestamp.now();

      if(this.checkoutForm.isShippingSameAsBilling){
        this.checkoutForm.billingAddress = this.checkoutForm.shippingAddress;
      }

      this.checkoutForm.cartItems.forEach(item => {
        item.dateProcessed = Timestamp.now();
        item.processedStatus = "NEW"
        item.price = item.price && NumberUtil.isNumber(item.price)? item.price : 0;
      })

      this.checkoutForm = this.purchasesService.saveCheckoutForm(this.checkoutForm);

      e.preventDefault();

      this.setLoading(true);

      if(NumberUtil.isNumber(this.checkoutForm.total) && this.checkoutForm.total && this.checkoutForm.total > 0){
        await this.stripeService.submitStripePayment(this.checkoutForm, this.elements)
      } else {
        this.router.navigate(['/checkout-success'], { queryParams: { savedForm: this.checkoutForm.id }});
      }

      this.setLoading(false);
      this.isProcessingPanelVisible = false;
    }
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

  private settleCart(){
    let total = 0; // Initialize the total for applicable items
    let totalDiscount = 0; // Initialize the total for applicable items

    this.checkoutForm.cartItems.forEach(item => {
      if(item.weight){
        this.totalShippingWeight += item.weight
      }

      total += (item.price * item.orderQuantity);

      totalDiscount += (item.discount * item.orderQuantity);
    });

    this.checkoutForm.discount = NumberUtil.isNumber(totalDiscount)? parseFloat(totalDiscount.toFixed(2)) : 0;

    this.checkoutForm.totalBeforeDiscount = NumberUtil.isNumber(total)? total : 0;

    this.checkoutForm.total =  Math.max((this.checkoutForm.totalBeforeDiscount - this.checkoutForm.discount), 0);

    this.purchasesService.saveCheckoutForm(this.checkoutForm);
  }

  submitRequest(){
    this.purchasesService.saveCheckoutForm(this.checkoutForm);

    this.sendProductPurchaseSuccessEmail(this.checkoutForm);

    this.router.navigate(['/checkout-success'], { queryParams: { savedForm: this.checkoutForm.id }});
  }

  sendProductPurchaseSuccessEmail(cart: CheckoutForm){
    let subject = 'Thank you for Your Purchase ';
    let text = '<div>You have purchased the following</div><br>';

    this.cartService.getCartProducts().forEach(product => {
      text += "<li><span>"
      if(product.discountPrice) {
        text += product.orderQuantity + "  x  " + product.itemName + " for $" + (product.orderQuantity * product.discountPrice? product.discountPrice:0).toFixed(2) + " (<span><s>" + product.price.toFixed(2)+"</s></span>)"
      } else {
        text += product.orderQuantity + "  x  " + product.itemName + " for $" + (product.orderQuantity * product.price? product.price:0).toFixed(2)
      }

      if(product.isEBook){
        text += "<a href='"+ product.eBookUrl.url+"' download>     DOWNLOAD " + product.itemName + "</a>";
      }
      text += "</span></li>";
    })
    text +="</ul><br>"

    if(cart.estimatedTaxes){
      text += '<div>Tax: $' + (cart.estimatedTaxes).toFixed(2) + '</div><br>'
    }

    if(cart.shippingRate){
      text += '<div>Shipping: $' + (cart.shippingRate).toFixed(2) + '</div><br>'
    }

    if(cart.couponCode) {
      text += '<div>Subtotal: $' + (cart.totalBeforeDiscount).toFixed(2) + '</div><br>'
      text += '<div>Applied Coupon: ' + cart.couponCode + '</div><br>';
      text += '<div>Total: $' + (cart.total).toFixed(2) + '</div><br>'
    } else {
      text += '<div>Total: $' + (cart.total).toFixed(2) + '</div><br>'
    }

    if(cart.receipt){
      text += '<div>Confirmation Id: ' + cart.receipt + '<br>'
    }

    this.emailService.sendHtmlEmail(cart.email, subject, text);
  }
}
