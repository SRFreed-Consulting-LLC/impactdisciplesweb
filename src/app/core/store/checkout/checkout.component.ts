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
import { CustomerService } from 'impactdisciplescommon/src/services/data/customer.service';
import { SalesService } from 'impactdisciplescommon/src/services/data/sales.service';
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

  NumberUtil = NumberUtil;

  showEstimatedTaxesSpinner: boolean = false;
  showShippingSpinner: boolean = false;
  isProcessingPanelVisible: boolean = false;
  isSetupPanelVisible: boolean = false;
  isPayButtonVisible: boolean = false;

  private ngUnsubscribe = new Subject<void>();

  constructor(
    public cartService: CartService,
    private stripeService: StripeService,
    private salesService: SalesService,
    private couponService: CouponService,
    private shippingService: ShippingService,
    private authService: AuthService,
    private customerService: CustomerService,
    private toastrService: ToastrService,
    private taxService: TaxRateService,
    private actions$: Actions,
    private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.setView();

    const shoppingCart = history.state.data;

    this.checkoutForm = {
      cartItems: this.cartService.getCartProducts(),
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

    this.states = EnumHelper.getStateRoleTypesAsArray();
    this.countries = EnumHelper.getCountryTypesAsArray()

    this.actions$.pipe(
      ofActionDispatched(UserAuthenticated),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(({ user }: UserAuthenticated) => {
      this.loggedInUser = `${user.firstName} ${user.lastName}`
      this.isLoggedIn = true
    })

    this.authService.getUser().pipe(takeUntil(this.ngUnsubscribe)).subscribe((user) => {
      if(user) {
        this.isLoggedIn = true;
        this.loggedInUser = `${user.firstName} ${user.lastName}`
        this.checkoutForm = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          // TODO: Need to change to use saved addresses in user account
          billingAddress: user.billingAddress || null,
          shippingAddress: this.checkoutForm.isShippingSameAsBilling ? user.billingAddress : null,
          ...this.checkoutForm
        }
      }
    });
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

  async createUserAccount(){
    let user: CustomerModel = await this.customerService.createCustomerAccount(this.checkoutForm);

    this.authService.createAccount(user.email, this.password).then((result) => {
      if (result.isOk) {
        this.toastrService.success('Success', 'Your account has been created.', {
          timeOut: 10000,
        });
      } else {
        this.toastrService.error('Error', 'There was an error creating your account: ' + result.message, {
          timeOut: 10000,
        });
      }
    })

  }

  calculateShippingCost = async () => {
    this.showShippingSpinner = true;

    this.checkoutForm = await this.shippingService.calculateShipping(this.checkoutForm);
  }

  calculateEstimatedTax = async () => {
    this.showEstimatedTaxesSpinner = true;

    this.checkoutForm = await this.taxService.calculateTaxRate(this.checkoutForm);
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
              description += "Shipping $" + this.checkoutForm.shippingRate.toFixed(2) + "\n";

              this.items.push({id: 'shipping', amount: this.checkoutForm.shippingRate * 100})
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

      this.checkoutForm = this.salesService.saveCheckoutForm(this.checkoutForm);

      e.preventDefault();

      this.setLoading(true);

      if(this.checkoutForm.isCreateAccount){
        await this.createUserAccount()
      }

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
      total += (item.price * item.orderQuantity);

      totalDiscount += (item.discount * item.orderQuantity);
    });

    this.checkoutForm.discount = NumberUtil.isNumber(totalDiscount)? parseFloat(totalDiscount.toFixed(2)) : 0;

    this.checkoutForm.totalBeforeDiscount = NumberUtil.isNumber(total)? total : 0;

    this.checkoutForm.total =  Math.max(this.checkoutForm.totalBeforeDiscount - this.checkoutForm.discount, 0);

    this.salesService.saveCheckoutForm(this.checkoutForm);
  }
}
