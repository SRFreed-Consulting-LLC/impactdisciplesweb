import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Actions } from '@ngxs/store';
import { DxFormComponent } from 'devextreme-angular';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { CouponService } from 'impactdisciplescommon/src/services/utils/coupon.service';
import { StripeService } from 'impactdisciplescommon/src/services/utils/stripe.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { CartItem, CheckoutForm } from 'src/app/shared/models/cart.model';
import { COUNTRIES } from 'src/app/shared/utils/data/countries-data';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { environment } from 'src/environments/environment';

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
  countries = COUNTRIES;
  couponCode: string = '';
  discountAmount: number = 0;
  orignalTotal: number = 0;
  isPercent: boolean = false;
  phoneEditorOptions = {
    mask: '+1 (X00) 000-0000',
    maskRules: {
      X: /[02-9]/,
    },
    maskInvalidMessage: 'The phone must have a correct USA phone format'
  };
  password: string = ''; 

  private ngUnsubscribe = new Subject<void>();

  constructor (
    private stripeService: StripeService,
    private toastrService: ToastrService,
    private authService: AuthService,
    public cartService: CartService,
    private couponService: CouponService
  ) {}

  async ngOnInit(): Promise<void> {
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      this.status = "REQUEST"
    } else {
      this.status = "RESPONSE"
    }
    this.toggleForm()
    this.checkoutForm = {
      cartItems: this.cartService.getCartProducts(),
      total: this.cartService.totalPriceQuantity().total,
      isShippingSameAsBilling: true,
      isNewsletter: true,
      isCreateAccount: false
    }
    this.orignalTotal = this.checkoutForm.total;
  }

  async toggleForm(): Promise<void> {
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
          });

          if (!response.ok) {
            throw new Error('Failed to fetch client secret');
          }

          const { clientSecret } = await response.json();

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
  }

  async handleSubmit(e) {

    if(this.checkoutFormComponent.instance.validate().isValid) {
      e.preventDefault();
      this.setLoading(true);
      let response = await this.stripeService.getStripe().then(async stripe => {
        if(this.checkoutForm.isCreateAccount) {
          this.authService.createAccount(this.checkoutForm.email, this.password).pipe(takeUntil(this.ngUnsubscribe)).subscribe((result) => {
            if (result.isOk) {
              this.toastrService.success('Your account has been created.');
            } else {
              this.toastrService.error('There was an error creating your account: ' + result.message);
            }
  
          })
        }
        return await stripe.confirmPayment({
          elements: this.elements,
          confirmParams: {
            // Make sure to change this to your payment completion page
            return_url: environment.domain + "/registration-checkout-success",
          },
        });
      })

      // This point will only be reached if there is an immediate error when
      // confirming the payment. Otherwise, your customer will be redirected to
      // your `return_url`. For some payment methods like iDEAL, your customer will
      // be redirected to an intermediate site first to authorize the payment, then
      // redirected to the `return_url`.
      if (response.error.type === "card_error" || response.error.type === "validation_error") {
        this.showMessage(response.error.message, 'ERROR');
      } else {
        this.showMessage("An unexpected error occurred.", 'ERROR');
      }
      this.setLoading(false);
    }
  }

  async checkStatus() {
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    const { paymentIntent } = await this.stripeService.getStripe().then(async stripe => {
      return await stripe.retrievePaymentIntent(clientSecret);
    })

    switch (paymentIntent.status) {
      case "succeeded":
        this.showMessage("Payment succeeded!", 'SUCCESS');
        break;
      case "processing":
        this.showMessage("Your payment is processing.", 'INFO');
        break;
      case "requires_payment_method":
        this.showMessage("Your payment was not successful, please try again.", 'ERROR');
        break;
      default:
        this.showMessage("Something went wrong.", 'ERROR');
        break;
    }
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

  handleCountryInput = (e: any) => {
    const inputValue = e.component.option("text");
    const country = this.countries.find(
      (c) => c.name.toLowerCase() === inputValue.toLowerCase()
    );

    if (country) {
      e.component.option("value", country.name);
    }
  };

  calculateTotal(cartItems: CartItem[]): number {
    return cartItems.reduce((acc, item) => acc + (item.price ?? 0) * (item.orderQuantity ?? 1), 0);
  }

  // Method to handle coupon application
  applyCoupon() {
    if (this.couponCode) {
      this.couponService.getAllByValue('code', this.couponCode).then(coupons => {
        if (coupons.length > 0 && coupons[0].isActive) {
          let validCoupon = coupons[0];
          let total = this.calculateTotal(this.checkoutForm.cartItems);

          let isvalid: boolean = false;

          let itemIds: string[] = this.checkoutForm.cartItems.map(item => item.id)

          if(!validCoupon.tags){
            validCoupon.tags = [];
          }

          validCoupon.tags.forEach(tag => {
            if(itemIds.includes(tag)){
              isvalid = true;
            }
          })

          if(isvalid){
            if (validCoupon.percentOff) {
              this.discountAmount = validCoupon.percentOff;
              this.checkoutForm.total = total - ((total * validCoupon.percentOff) / 100);
              this.isPercent = true;
            } else if (validCoupon.dollarsOff) {
              this.discountAmount = validCoupon.dollarsOff;
              this.discountAmount = Math.min(this.discountAmount, total);
              this.checkoutForm.total = total - this.discountAmount;
            }

            this.showMessage("Coupon applied successfully.", 'SUCCESS');
          } else {
            this.showMessage("Coupon not Valid for these items.", 'ERROR');
          }

        } else {
          this.showMessage("Invalid or inactive coupon.", 'ERROR');
        }
        this.toggleForm()
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
