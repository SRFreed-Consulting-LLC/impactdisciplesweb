import { NewsletterSubscriptionModel } from 'impactdisciplescommon/src/models/domain/newsletter-subscription.model';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { PHONE_TYPES } from 'impactdisciplescommon/src/lists/phone_types.enum';
import { Role } from 'impactdisciplescommon/src/lists/roles.enum';
import { AppUser } from 'impactdisciplescommon/src/models/admin/appuser.model';
import { Address } from 'impactdisciplescommon/src/models/domain/utils/address.model';
import { Phone } from 'impactdisciplescommon/src/models/domain/utils/phone.model';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { StripeService } from 'impactdisciplescommon/src/services/utils/stripe.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { environment } from 'src/environments/environment';
import { Timestamp } from 'firebase/firestore';
import { EnumHelper } from 'impactdisciplescommon/src/utils/enum_helper';
import { CartItem, CheckoutForm } from 'impactdisciplescommon/src/models/utils/cart.model';
import { Router } from '@angular/router';
import { CouponModel } from 'impactdisciplescommon/src/models/utils/coupon.model';
import { CustomerService } from 'impactdisciplescommon/src/services/data/customer.service';
import { SalesService } from 'impactdisciplescommon/src/services/data/sales.service';
import { NewsletterSubscriptionService } from 'impactdisciplescommon/src/services/data/newsletter-subscription.service';
import { CouponService } from 'impactdisciplescommon/src/services/data/coupon.service';

@Component({
  selector: 'app-registration-checkout',
  templateUrl: './registration-checkout.component.html',
  styleUrls: ['./registration-checkout.component.scss']
})
export class RegistrationCheckoutComponent implements OnInit, OnDestroy {
  @ViewChild('checkoutFormComponent', { static: false }) checkoutFormComponent: DxFormComponent;

  checkoutForm: CheckoutForm = {};
  status: string = "REQUEST";
  elements;
  items = [];
  couponCode: string = '';
  discountAmount: number = 0;
  orignalTotal: number = 0;
  isPercent: boolean = false;
  logInForm: { email: string, password: string } = { email: '', password: '' };
  phoneEditorOptions = {
    mask: '(X00) 000-0000',
    maskRules: {
      X: /[02-9]/,
    },
    maskInvalidMessage: 'The phone must have a correct USA phone format'
  };
  password: string = '';

  paymentIntent: string;
  public states: string[];
  public countries: string[];

  private ngUnsubscribe = new Subject<void>();

  constructor (
    private stripeService: StripeService,
    private toastrService: ToastrService,
    private authService: AuthService,
    public cartService: CartService,
    private couponService: CouponService,
    private customerService: CustomerService,
    private salesService: SalesService,
    private router: Router,
    private newsletterSubscriptionService: NewsletterSubscriptionService
  ) {}

  async ngOnInit(): Promise<void> {
    this.checkoutForm = {
      cartItems: this.cartService.getCartProducts(),
      total: this.cartService.totalPriceQuantity().total,
      isShippingSameAsBilling: true,
      isNewsletter: true,
      isCreateAccount: false,
      totalBeforeDiscount: this.cartService.totalPriceQuantity().total,
      billingAddress: { state: '', country:'United States'}
    }
    this.orignalTotal = this.checkoutForm.total;

    this.toggleForm()

    this.states = EnumHelper.getStateRoleTypesAsArray();
    this.countries = EnumHelper.getCountryTypesAsArray()
  }

  clearCart() {
    this.cartService.clearCart();
    this.router.navigateByUrl('/register');
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
              if(product.isEvent){
                this.items.push({id: product.id, amount: (this.checkoutForm.total * 100)})
              }
            })

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
      let savedForm: CheckoutForm = await this.saveCheckoutForm();

      e.preventDefault();

      this.setLoading(true);

      if(this.checkoutForm.isNewsletter){
        await this.newsletterSubscriptionService.createNewsLetterSubscription(this.checkoutForm.firstName, this.checkoutForm.lastName, this.checkoutForm.email);
      }

      if(this.checkoutForm.isCreateAccount){
        this.createUserAccount();
      }

      if(this.checkoutForm.total > 0){
        this.submitStripePayment(savedForm);
      } else {
        this.cancelStripeIntent();
      }

      this.setLoading(false);
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
          return_url: environment.domain + "/registration-checkout-success?savedForm=" + savedForm.id,
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
    })
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

  calculateTotal(cartItems: CartItem[]): number {
    return cartItems.reduce((acc, item) => acc + (item.price ?? 0) * (item.orderQuantity ?? 1), 0);
  }

  // Method to handle coupon application
  applyCoupon() {
    if (this.couponCode) {
      this.couponService.getAllByValue('code', this.couponCode).then(coupons => {
        if (coupons.length > 0 && coupons[0].isActive) {
          let validCoupon:CouponModel = coupons[0];

          let total = 0;

          let isValid: boolean = false;

          this.checkoutForm.cartItems.forEach(item => {
            let itemTotal = item.price * item.orderQuantity;

            if (validCoupon?.tags?.length > 0) {
              let matchingTag = validCoupon.tags.some(tag => tag.id === item.id);

              if (matchingTag) {
                isValid = true;

                // Apply the discount to the item total
                if (validCoupon.percentOff) {
                  this.isPercent = true;

                  this.discountAmount = validCoupon.percentOff;

                  total += itemTotal - ((itemTotal * validCoupon.percentOff) / 100);
                } else if (validCoupon.dollarsOff) {
                  let discountAmount = Math.min(validCoupon.dollarsOff, itemTotal);

                  total += itemTotal - discountAmount;
                }
              } else {
                // If item tags don't match, add the item total without discount
                total += itemTotal;
              }
            } else {
              // If no tags on the coupon, apply discount to all items
              isValid = true;

              if (validCoupon.percentOff) {
                this.isPercent = true;

                this.discountAmount = validCoupon.percentOff;

                total += itemTotal - ((itemTotal * validCoupon.percentOff) / 100);
              } else if (validCoupon.dollarsOff) {
                let discountAmount = Math.min(validCoupon.dollarsOff, itemTotal);

                total += itemTotal - discountAmount;
              }
            }
          });

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
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
