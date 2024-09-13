import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { CartItem, CheckoutForm } from 'src/app/shared/models/cart.model';
import { COUNTRIES } from 'src/app/shared/utils/data/countries-data';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { environment } from 'src/environments/environment';
import { StripeService } from './stripe.service';
import { Actions, ofActionDispatched } from '@ngxs/store';
import { UserAuthenticated } from 'impactdisciplescommon/src/services/actions/authentication.actions';
import { CouponService } from 'impactdisciplescommon/src/services/utils/coupon.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('checkoutFormComponent', { static: false }) checkoutFormComponent: DxFormComponent;

  checkoutForm: CheckoutForm = {};
  status: string = "REQUEST";
  elements;
  items = [{ id: "xl-tshirt", amount: 1000 }];
  countries = COUNTRIES;
  isOpenLogin = false;
  isOpenCoupon = false;
  isLoggedIn = false;
  loggedInUser: string = '';
  logInForm: { email: string, password: string } = { email: '', password: '' };
  couponCode: string = '';
  discountAmount: number = 0;
  orignalTotal: number = 0;
  isPercent: boolean = false;


  private ngUnsubscribe = new Subject<void>();

  constructor (
    private actions$: Actions,
    private stripeService: StripeService,
    private toastrService: ToastrService,
    private authService: AuthService,
    public cartService: CartService,
    private couponService: CouponService,
    private router: Router
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
    this.checkoutForm = {
      cartItems: this.cartService.getCartProducts(),
      total: this.cartService.totalPriceQuantity().total,
      isShippingSameAsBilling: true,
      isNewsletter: true
    }
    this.orignalTotal = this.checkoutForm.total;

    this.actions$.pipe(
      ofActionDispatched(UserAuthenticated),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(({ user }: UserAuthenticated) => {
      console.log(user)
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
    console.log(this.checkoutForm)
  }

  async ngAfterViewInit(): Promise<void> {
    if(this.status === "RESPONSE"){
      this.checkStatus();
    } else {
      document.querySelector("#payment-form").addEventListener("submit", this.handleSubmit.bind(this));

      const response = await fetch(environment.stripeURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.items),
      });

      const { clientSecret } = await response.json();

      this.elements = (await this.stripeService.getStripe()).elements({ clientSecret });

      const paymentElementOptions = {
        layout: "tabs",
      };

      const paymentElement = this.elements.create("payment", paymentElementOptions);

      paymentElement.mount("#payment-element");
      }
  }

  async handleSubmit(e) {

    if(this.checkoutFormComponent.instance.validate()) {
      e.preventDefault();
      this.setLoading(true);

      let response = await this.stripeService.getStripe().then(async stripe => {
        return await stripe.confirmPayment({
          elements: this.elements,
          confirmParams: {
            // Make sure to change this to your payment completion page
            return_url: environment.domain + "/checkout-success",
          },
        });
      })

      console.log(response.error);

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
    this.authService.logIn(this.logInForm.email, this.logInForm.password).subscribe(val => console.log(val))
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
          this.showMessage("Invalid or inactive coupon.", 'ERROR');
        }
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
