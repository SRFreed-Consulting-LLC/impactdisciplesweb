import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, ofActionDispatched } from '@ngxs/store';
import { DxFormComponent } from 'devextreme-angular';
import { Timestamp } from 'firebase/firestore';
import { PHONE_TYPES } from 'impactdisciplescommon/src/lists/phone_types.enum';
import { Role } from 'impactdisciplescommon/src/lists/roles.enum';
import { AppUser } from 'impactdisciplescommon/src/models/admin/appuser.model';
import { NewsletterSubscriptionModel } from 'impactdisciplescommon/src/models/domain/newsletter-subscription.model';
import { Address } from 'impactdisciplescommon/src/models/domain/utils/address.model';
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
import { WebConfigService } from 'impactdisciplescommon/src/services/data/web-config.service';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { StripeService } from 'impactdisciplescommon/src/services/utils/stripe.service';
import { EnumHelper } from 'impactdisciplescommon/src/utils/enum_helper';
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
  public states: string[];
  public countries: string[];

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
    private webConfigService: WebConfigService,
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

  calculateShippingCost = async () => {
    this.showShippingSpinner = true;

    let totalWeight: number;
    try{
      totalWeight = this.checkoutForm.cartItems.filter(item => item.isEvent == false).map(item => item.weight? item.weight : 0).reduce((a,b) => a + b);
    }
    catch(err){
      totalWeight = 0;
    }

    if(totalWeight > 0){
      const configs = await this.webConfigService.getAll();

      return this.shippingService.calculateShipping(configs[0], this.checkoutForm, totalWeight).then(result => {
        if (result) {
          result.rateResponse.rates.sort((a, b) => a.shippingAmount.amount - b.shippingAmount.amount);

          this.checkoutForm.shippingRateId = {... result.rateResponse.rates[0]};

          this.checkoutForm.shippingRate = Number(Number(result.rateResponse.rates[0].shippingAmount.amount).toFixed(2));

          this.checkoutForm.total += this.checkoutForm.shippingRate > 0 ? this.checkoutForm.shippingRate : 0;
        }
      })
    } else {
      this.checkoutForm.shippingRate = 0;

      return Promise.resolve(0)
    }
  }

  calculateEstimatedTax = async () => {
    this.showEstimatedTaxesSpinner = true;

    const taxRates = await this.taxService.getAllByValue("zipCode", this.checkoutForm.shippingAddress.zip);
    if (!taxRates || taxRates.length == 0) {
      console.log("No qualified tax rate found for zip code " + this.checkoutForm.shippingAddress.zip);
    } else if (taxRates.length > 1) {
      console.log("found more than 1 qualified tax rate");
    } else {
      this.checkoutForm.taxRate = taxRates[0].estimatedCombinedRate;

      let taxableAmount : number;

      try{
        taxableAmount = this.checkoutForm.cartItems.filter(item => item.isEvent == false).map(item => item.price? item.price : 0)?.reduce((a,b) => a + b);
      } catch(err){
        taxableAmount = 0;
      }

      this.checkoutForm.estimatedTaxes = Number((taxableAmount * taxRates[0].estimatedCombinedRate).toFixed(2));

      this.checkoutForm.total += Number(this.checkoutForm.estimatedTaxes.toFixed(2));
    }
  }

  applyCoupon() {
    this.cancelStripeIntent();

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

            this.showMessage("Coupon applied successfully.", 'SUCCESS');
          } else {
            this.showMessage("Coupon not valid for these items.", 'ERROR');
          }
        } else {
          this.showMessage("Invalid or inactive coupon.", 'ERROR');
        }
        this.toggleForm();
      }).catch(error => {
        console.error("Error fetching coupon:", error);
        this.showMessage("Failed to apply coupon.", 'ERROR');
      });
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
            this.cancelStripeIntent().then(() => {
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
    await this.customerService.getAllByValue('email', this.checkoutForm.email).then(async users => {
      if(users && users.length == 0){
        let newUser: AppUser = {... new AppUser()};
        newUser.firstName = this.checkoutForm.firstName;
        newUser.lastName = this.checkoutForm.lastName;
        newUser.email = this.checkoutForm.email;

        let billingAddress = {... new Address()};
        billingAddress.address1 = this.checkoutForm.billingAddress.address1;
        billingAddress.address2 = this.checkoutForm.billingAddress.address2 ? this.checkoutForm.billingAddress.address2 :  '';
        billingAddress.city = this.checkoutForm.billingAddress.city;
        billingAddress.state = this.checkoutForm.billingAddress.state;
        billingAddress.zip = this.checkoutForm.billingAddress.zip;
        billingAddress.country = this.checkoutForm.billingAddress.country;

        newUser.billingAddress = billingAddress;

        let shippingAddress = {... new Address()};
        shippingAddress.address1 = this.checkoutForm.shippingAddress.address1;
        shippingAddress.address2 = this.checkoutForm.shippingAddress.address2 ? this.checkoutForm.billingAddress.address2 :  '';
        shippingAddress.city = this.checkoutForm.shippingAddress.city;
        shippingAddress.state = this.checkoutForm.shippingAddress.state;
        shippingAddress.zip = this.checkoutForm.shippingAddress.zip;
        shippingAddress.country = this.checkoutForm.shippingAddress.country;

        if(this.checkoutForm.isShippingSameAsBilling){
          newUser.shippingAddress = billingAddress;
        } else {
          let shippingAddress = {... new Address()};
          shippingAddress.address1 = this.checkoutForm.shippingAddress.address1;
          shippingAddress.address2 = this.checkoutForm.shippingAddress.address2 ? this.checkoutForm.billingAddress.address2 :  '';
          shippingAddress.city = this.checkoutForm.shippingAddress.city;
          shippingAddress.state = this.checkoutForm.shippingAddress.state;
          shippingAddress.zip = this.checkoutForm.shippingAddress.zip;
          shippingAddress.country = this.checkoutForm.shippingAddress.country;

          newUser.shippingAddress = shippingAddress;
        }

        let phone = {... new Phone()}
        phone.countryCode = '1';
        phone.number = this.checkoutForm.phone.number;
        phone.extension = PHONE_TYPES.CELL;

        newUser.phone = phone;

        newUser.role = Role.CUSTOMER;
        await this.customerService.add(newUser).then(async user => {
          await this.authService.createAccount(user.email, this.password).pipe(takeUntil(this.ngUnsubscribe)).subscribe((result) => {
            if (result.isOk) {
              this.toastrService.success('Success', 'Your account has been created.', {
                timeOut: 10000,
              });
            } else {
              this.toastrService.error('Error','There was an error creating your account: ' + result.message, {
                timeOut: 10000,
              });
            }
          })
        });
      } else  {
        this.toastrService.success('Warning', 'An account with this email already exists.', {
          timeOut: 10000,
        })
      }
    })
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

        this.showMessage('Failed to load payment form. Please try again.', 'ERROR');
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

      let savedForm: CheckoutForm = await this.saveCheckoutForm();

      e.preventDefault();

      this.setLoading(true);

      if(this.checkoutForm.isNewsletter){
        await this.newsletterSubscriptionService.createNewsLetterSubscription(this.checkoutForm.firstName, this.checkoutForm.lastName, this.checkoutForm.email);
      }

      if(this.checkoutForm.isCreateAccount){
        this.createUserAccount()
      }

      if(this.isNan(this.checkoutForm.total) && this.checkoutForm.total && this.checkoutForm.total > 0){
        this.submitStripePayment(savedForm)
      } else {
        this.router.navigate(['/checkout-success'], { queryParams: { savedForm: savedForm.id }});
      }

      this.setLoading(false);
      this.isProcessingPanelVisible = false;
    }
  }

  async saveCheckoutForm(){
    this.checkoutForm.processedStatus = "NEW";
    this.checkoutForm.dateProcessed = Timestamp.now();

    if(this.checkoutForm.isShippingSameAsBilling){
      this.checkoutForm.billingAddress = this.checkoutForm.shippingAddress;
    }

    this.checkoutForm.cartItems.forEach(item => {
      item.dateProcessed = Timestamp.now();
      item.processedStatus = "NEW"
    })

    return await this.salesService.add(this.checkoutForm);
  }

  async submitStripePayment(savedForm: CheckoutForm){
    let response = await this.stripeService.getStripe().then(async stripe => {
      return await stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: environment.domain + "/checkout-success?savedForm=" + savedForm.id,
        },
      })
    })

    if (response.error.type === "card_error" || response.error.type === "validation_error") {
      this.showMessage(response.error.message, 'ERROR');
    } else {
      this.showMessage("An unexpected error occurred.", 'ERROR');
    }
  }

  async cancelStripeIntent(){
    if(this.paymentIntent){
      await fetch(environment.stripeCancelURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 'paymentIntent': this.paymentIntent })
      });
    }
  }

  showMessage(messageText, type) {
    if(type ==='SUCCESS'){
      this.toastrService.success(messageText, 'SUCCESS!')
    } else if(type ==='INFO'){
      this.toastrService.info(messageText)
    } else if(type ==='ERROR'){
      this.toastrService.error(messageText, 'ERROR!')
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
