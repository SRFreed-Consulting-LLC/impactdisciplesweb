import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, ofActionDispatched } from '@ngxs/store';
import { DxFormComponent } from 'devextreme-angular';
import { Timestamp } from 'firebase/firestore';
import { PHONE_TYPES } from 'impactdisciplescommon/src/lists/phone_types.enum';
import { Role } from 'impactdisciplescommon/src/lists/roles.enum';
import { AppUser } from 'impactdisciplescommon/src/models/admin/appuser.model';
import { Address } from 'impactdisciplescommon/src/models/domain/utils/address.model';
import { CustomerModel } from 'impactdisciplescommon/src/models/domain/utils/customer.model';
import { Phone } from 'impactdisciplescommon/src/models/domain/utils/phone.model';
import { CheckoutForm } from 'impactdisciplescommon/src/models/utils/cart.model';
import { CouponModel } from 'impactdisciplescommon/src/models/utils/coupon.model';
import { UserAuthenticated } from 'impactdisciplescommon/src/services/actions/authentication.actions';
import { CouponService } from 'impactdisciplescommon/src/services/data/coupon.service';
import { CustomerService } from 'impactdisciplescommon/src/services/data/customer.service';
import { NewsletterSubscriptionService } from 'impactdisciplescommon/src/services/data/newsletter-subscription.service';
import { SalesService } from 'impactdisciplescommon/src/services/data/sales.service';
import { ShippingService } from 'impactdisciplescommon/src/services/data/shipping.service';
import { TaxRateService } from 'impactdisciplescommon/src/services/data/tax-rate.service';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { StripeService } from 'impactdisciplescommon/src/services/utils/stripe.service';
import { EnumHelper } from 'impactdisciplescommon/src/utils/enum_helper';
import { ToastrService } from 'ngx-toastr';
import { Subject, take, takeUntil } from 'rxjs';
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
    private newsletterSubscriptionService: NewsletterSubscriptionService,
    private taxService: TaxRateService,
    private actions$: Actions,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.setView();
    this.checkoutForm = {
      cartItems: this.cartService.getCartProducts(),
      total: this.isNan(this.cartService.totalPriceQuantity().total)? this.cartService.totalPriceQuantity().total : 0,
      totalBeforeDiscount: this.isNan(this.cartService.totalPriceQuantity().total)? this.cartService.totalPriceQuantity().total : 0,
      isShippingSameAsBilling: true,
      isNewsletter: true,
      billingAddress: { state: '', country: 'United States'},
      shippingAddress: { state: '' , country: 'United States'}
    }

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

  applyCoupon() {
    this.stripeService.cancelStripeIntent(this.paymentIntent);

    this.resetCartItems();

    if (this.couponCode) {
      this.couponService.getAllByValue('code', this.couponCode).then(coupons => {
        if (coupons.length > 0 && coupons[0].isActive) {
          let validCoupon = coupons[0];

          let total = 0; // Initialize the total for applicable items

          let isValid: boolean = false;

          if(validCoupon?.tags?.length > 0) {
            this.checkoutForm.cartItems.forEach(item => {
              let itemTotal = item.price? item.price * item.orderQuantity : 0; // Calculate total for each item

              if ((validCoupon?.tags?.length > 0 && validCoupon.tags.some(tag => tag.id === item.id))) {
                isValid = true;
                this.itemDiscountAmount = validCoupon;
                if (validCoupon.percentOff) {
                  item.discountPrice = item.price - ((item.price * validCoupon.percentOff) / 100);
                } else if (validCoupon.dollarsOff) {
                  item.discountPrice = Math.max(item.price - validCoupon.dollarsOff, 0);
                }
                total+=(item.discountPrice * item.orderQuantity);
              } else {
                total+=itemTotal;
              }
            });
          } else {
            isValid = true;
            this.cartDiscountAmount = validCoupon;
            if (validCoupon.percentOff) {
              total += this.checkoutForm.total - ((this.checkoutForm.total * validCoupon.percentOff) / 100);
            } else if (validCoupon.dollarsOff) {
              let discountAmount = Math.min(validCoupon.dollarsOff, this.checkoutForm.total);
              total += this.checkoutForm.total - discountAmount;
            }
          }


          if (isValid) {
            this.checkoutForm.total = this.isNan(total)? total : 0;

            this.checkoutForm.couponCode = validCoupon.code;

            this.toastrService.success("Coupon applied successfully.", 'SUCCESS!')
          } else {
            this.toastrService.error("Coupon not valid for these items.", 'ERROR!')
          }
        } else {
          this.toastrService.error("Invalid or inactive coupon.", 'ERROR!')
        }
        this.toggleForm();
      })
    } else {
      this.resetCartItems();
      this.toggleForm();
    }
  }

  resetCartItems() {
    this.checkoutForm.cartItems.forEach(item => {
      if (item.discountPrice || item.discountPrice === 0) {
        item.discountPrice = null;
      }
    });
    this.checkoutForm.total = this.isNan(this.cartService.totalPriceQuantity().total)? this.cartService.totalPriceQuantity().total : 0;
    this.itemDiscountAmount = null;
    this.cartDiscountAmount = null;
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

          if(this.checkoutForm.shippingAddress.state == 'Georgia'){
            promises.push(this.calculateEstimatedTax());
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

    this.authService.createAccount(user.email, this.password).pipe(take(1)).subscribe((result) => {
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
    if(this.isNan(this.checkoutForm.total) && this.checkoutForm.total && this.checkoutForm.total > 0){
      try {
        setTimeout(async () => {
          const paymentForm = document.querySelector("#payment-form");
          if (paymentForm) {
            paymentForm.addEventListener("submit", this.handleSubmit.bind(this));

            this.items = [];

            this.cartService.getCartProducts().forEach(product => {
              if(product.price && product.price > 0){
                this.items.push({id: product.id, amount: ((product?.discountPrice === null || product?.discountPrice === undefined ? product.price? product.price : 0 : product.discountPrice) * product.orderQuantity * 100)})
              }
            })

            if(this.checkoutForm.shippingRate && this.checkoutForm.shippingRate > 0){
              this.items.push({id: 'shipping', amount: this.checkoutForm.shippingRate * 100})
            }

            if(this.checkoutForm.estimatedTaxes && this.checkoutForm.estimatedTaxes > 0){
              this.items.push({id: 'taxes', amount: this.checkoutForm.estimatedTaxes * 100})
            }

            let request = {};
            request['items'] = this.items;
            request['description'] = "Payment from " + this.checkoutForm.firstName + ' ' + this.checkoutForm.lastName;

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
        item.price = item.price && this.isNan(item.price)? item.price : 0;
      })

      this.checkoutForm = await this.salesService.saveCheckoutForm(this.checkoutForm);

      e.preventDefault();

      this.setLoading(true);

      if(this.checkoutForm.isNewsletter){
        await this.newsletterSubscriptionService.createNewsLetterSubscription(this.checkoutForm.firstName, this.checkoutForm.lastName, this.checkoutForm.email);
      }

      if(this.checkoutForm.isCreateAccount){
        await this.createUserAccount()
      }

      if(this.isNan(this.checkoutForm.total) && this.checkoutForm.total && this.checkoutForm.total > 0){
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

  public isNan(value){
    if(Number.isNaN(value)){
      return false
    } else {
      return true;
    }
   }

   ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
