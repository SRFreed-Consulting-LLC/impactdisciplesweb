import { ShippingService } from './../../../../../impactdisciplescommon/src/services/shipping.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { environment } from 'src/environments/environment';
import { Actions, ofActionDispatched } from '@ngxs/store';
import { UserAuthenticated } from 'impactdisciplescommon/src/services/actions/authentication.actions';
import { CouponService } from 'impactdisciplescommon/src/services/utils/coupon.service';
import { Router } from '@angular/router';
import { StripeService } from 'impactdisciplescommon/src/services/utils/stripe.service';
import { SalesService } from 'impactdisciplescommon/src/services/utils/sales.service';
import { CartItem, CheckoutForm } from 'impactdisciplescommon/src/models/utils/cart.model';
import { NewsletterSubscriptionService } from 'impactdisciplescommon/src/services/newsletter-subscription.service';
import { NewsletterSubscriptionModel } from 'impactdisciplescommon/src/models/domain/newsletter-subscription.model';
import { Timestamp } from 'firebase/firestore';
import { AppUserService } from 'impactdisciplescommon/src/services/admin/user.service';
import { AppUser } from 'impactdisciplescommon/src/models/admin/appuser.model';
import { Address } from 'impactdisciplescommon/src/models/domain/utils/address.model';
import { Phone } from 'impactdisciplescommon/src/models/domain/utils/phone.model';
import { PHONE_TYPES } from 'impactdisciplescommon/src/lists/phone_types.enum';
import { Role } from 'impactdisciplescommon/src/lists/roles.enum';
import { EnumHelper } from 'impactdisciplescommon/src/utils/enum_helper';
import { CouponModel } from 'impactdisciplescommon/src/models/utils/coupon.model';
import { WebConfigService } from 'impactdisciplescommon/src/services/utils/web-config.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  @ViewChild('checkoutFormComponent', { static: false }) checkoutFormComponent: DxFormComponent;

  checkoutForm: CheckoutForm = {};
  status: string = "REQUEST";
  elements;
  items = [];
  isOpenLogin = false;
  isOpenCoupon = false;
  isLoggedIn = false;
  loggedInUser: string = '';
  logInForm: { email: string, password: string } = { email: '', password: '' };
  couponCode: string = '';
  itemDiscountAmount: CouponModel;
  cartDiscountAmount: CouponModel;
  orignalTotal: number = 0;
  password: string = '';
  paymentIntent: string;
  public states: string[];
  public countries: string[];

  private ngUnsubscribe = new Subject<void>();

  constructor (
    private actions$: Actions,
    private stripeService: StripeService,
    private toastrService: ToastrService,
    private authService: AuthService,
    public cartService: CartService,
    private userService: AppUserService,
    private couponService: CouponService,
    private salesService: SalesService,
    private router: Router,
    private newsletterSubscriptionService: NewsletterSubscriptionService,
    private shippingService: ShippingService,
    private webConfigService: WebConfigService
  ) {}

  async ngOnInit(): Promise<void> {

    this.checkoutForm = {
      cartItems: this.cartService.getCartProducts(),
      total: this.cartService.totalPriceQuantity().total,
      totalBeforeDiscount: this.cartService.totalPriceQuantity().total,
      isShippingSameAsBilling: true,
      isNewsletter: true,
      billingAddress: {
        state: ''
      },
      shippingAddress: {
        state: ''
      }
    }
    this.orignalTotal = this.checkoutForm.total;

    this.toggleForm();

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
          billingAddress: user.address || null,
          shippingAddress: this.checkoutForm.isShippingSameAsBilling ? user.address : null,
          ...this.checkoutForm
        }
      }
    });
  }
  calculateShippingCost(){
    if(this.checkoutFormComponent.instance.validate().isValid) {
      let totalWeight: number = this.checkoutForm.cartItems.map(item => item.weight).reduce((a,b) => a + b);

      this.webConfigService.getAll().then(configs => {
        if(configs){
          this.shippingService.calculateShipping(configs[0], this.checkoutForm.firstName + ' ' + this.checkoutForm.lastName, this.checkoutForm.billingAddress, this.checkoutForm.phone, totalWeight)
          .then(result => {
            if(result) {
              result.rateResponse.rates.sort((a, b) => a.shippingAmount.amount - b.shippingAmount.amount);

              this.checkoutForm.shippingRate = result.rateResponse.rates[0].shippingAmount.amount

              this.checkoutForm.totalBeforeDiscount += this.checkoutForm.shippingRate;

              this.checkoutForm.total += this.checkoutForm.shippingRate;
              this.cancelStripeIntent().then(() => this.toggleForm());
            }
          })
        } else {
          this.toastrService.error('Error','There was an getting the Senders Adress', {
            timeOut: 10000,
          });

          return null
        }
      })

    }
  }

  async toggleForm(): Promise<void> {
    if(this.checkoutForm.total && this.checkoutForm.total > 0){
      try {
        setTimeout(async () => {
          const paymentForm = document.querySelector("#payment-form");
          if (paymentForm) {
            paymentForm.addEventListener("submit", this.handleSubmit.bind(this));

            this.items = [];

            this.cartService.getCartProducts().forEach(product => {
              this.items.push({id: product.id, amount: ((product?.discountPrice === null || product?.discountPrice === undefined ? product.price : product.discountPrice) * product.orderQuantity * 100)})
            })

            if(this.checkoutForm.shippingRate){
              this.items.push({id: 'shipping', amount: this.checkoutForm.shippingRate * 100})
            }
            console.log(this.items);

            // Fetch client secret for Stripe payment
            const response = await fetch(environment.stripeURL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(this.items),
            })

            if (!response.ok) {
              throw new Error('Failed to fetch client secret: ' + JSON.stringify(response));
            }

            const { clientSecret, paymentIntent } = await response.json();

            this.paymentIntent = paymentIntent;

            // Initialize Stripe Elements
            this.elements = (await this.stripeService.getStripe()).elements({ clientSecret });

            const paymentElementOptions = {
              layout: "tabs",
            };

            const paymentElement = this.elements.create("payment", paymentElementOptions);
            paymentElement.mount("#payment-element");

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

    }
  }

  async handleSubmit(e) {
      if(this.checkoutFormComponent.instance.validate().isValid) {
        this.checkoutForm.processedStatus = "NEW";
        this.checkoutForm.dateProcessed = Timestamp.now();

        if(this.checkoutForm.isShippingSameAsBilling){
          this.checkoutForm.shippingAddress = this.checkoutForm.billingAddress;
        }

        this.checkoutForm.cartItems.forEach(item => {
          item.dateProcessed = Timestamp.now();
          item.processedStatus = "NEW"
        })

        let savedForm: CheckoutForm = await this.saveCheckoutForm();

        e.preventDefault();

        this.setLoading(true);

        if(this.checkoutForm.isNewsletter){
          this.createNewLetter()
        }

        if(this.checkoutForm.isCreateAccount){
          this.createUserAccount()
        }

        if(this.checkoutForm.total > 0){
          this.submitStripePayment(savedForm)
        }

        this.setLoading(false);
      }
  }

  async createUserAccount(){
    await this.userService.getAllByValue('email', this.checkoutForm.email).then(async users => {
      if(users && users.length == 0){
        let newUser: AppUser = {... new AppUser()};
        newUser.firstName = this.checkoutForm.firstName;
        newUser.lastName = this.checkoutForm.lastName;
        newUser.email = this.checkoutForm.email;

        let address = {... new Address()};
        address.address1 = this.checkoutForm.billingAddress.address1;
        address.address2 = this.checkoutForm.billingAddress.address2 ? this.checkoutForm.billingAddress.address2 :  '';
        address.city = this.checkoutForm.billingAddress.city;
        address.state = this.checkoutForm.billingAddress.state;
        address.zip = this.checkoutForm.billingAddress.zip;
        address.country = this.checkoutForm.billingAddress.country;

        newUser.address = address;

        let phone = {... new Phone()}
        phone.countryCode = '1';
        phone.number = this.checkoutForm.phone.number;
        phone.extension = PHONE_TYPES.CELL;

        newUser.phone = phone;

        newUser.role = Role.CUSTOMER;
        await this.userService.add(newUser).then(async user => {
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

  async createNewLetter(){
    let subscriber: NewsletterSubscriptionModel = {...new NewsletterSubscriptionModel()};
    subscriber.firstName = this.checkoutForm.firstName;
    subscriber.lastName = this.checkoutForm.lastName;
    subscriber.email = this.checkoutForm.email;
    subscriber.date = Timestamp.now();
    await this.newsletterSubscriptionService.add(subscriber);
  }

  async saveCheckoutForm(){
    this.checkoutForm.processedStatus = "NEW";
    this.checkoutForm.dateProcessed = Timestamp.now();

    if(this.checkoutForm.isShippingSameAsBilling){
      this.checkoutForm.shippingAddress = this.checkoutForm.billingAddress;
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
    await fetch(environment.stripeCancelURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 'paymentIntent': this.paymentIntent })
    });
  }

  // ------- UI helpers -------
  showMessage(messageText, type) {
    if(type ==='SUCCESS'){
      this.toastrService.success(messageText, 'SUCCESS!')
    } else if(type ==='INFO'){
      this.toastrService.info(messageText)
    } else if(type ==='ERROR'){
      this.toastrService.error(messageText, 'ERROR!')
    }
  }

  // Show a spinner on payment submission
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

  completePurchase() {
    // Add Logic to handle purchase completion
    this.cartService.clearCart();
  }

  handleOpenLogin() {
    this.router.navigate(['/checkout-user']);
    //this.isOpenLogin = !this.isOpenLogin;
  }
  handleOpenCoupon() {
    this.isOpenCoupon = !this.isOpenCoupon;
  }
  handleLogout() {
    this.authService.logOut();
    this.isLoggedIn = false;
  }

  handleLogin() {
    this.authService.logIn(this.logInForm.email, this.logInForm.password);
  }

  calculateTotal(cartItems: CartItem[]): number {
    return cartItems.reduce((acc, item) => acc + (item.price ?? 0) * (item.orderQuantity ?? 1), 0);
  }

  // Method to handle coupon application
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
              let itemTotal = item.price * item.orderQuantity; // Calculate total for each item

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
            this.checkoutForm.total = total;

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
    this.checkoutForm.total = this.cartService.totalPriceQuantity().total
    this.orignalTotal = this.checkoutForm.total;
    this.itemDiscountAmount = null;
    this.cartDiscountAmount = null;
  }

  ngOnDestroy(): void {
    this.resetCartItems();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
