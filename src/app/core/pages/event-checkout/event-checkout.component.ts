import { AfterContentInit, AfterViewInit, Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { StripeService } from 'impactdisciplescommon/src/services/utils/stripe.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { ShoppingCartService } from './event-checkout.service';
import { CartItem, CheckoutForm } from './cart.model';
import { COUNTRIES } from 'src/app/shared/utils/data/countries-data';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { DxFormComponent } from 'devextreme-angular';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-event-checkout',
  templateUrl: './event-checkout.component.html',
  styleUrls: ['./event-checkout.component.scss']
})
export class EventCheckoutComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('billingForm', { static: false }) billingForm: DxFormComponent;
  @ViewChildren('attendeeForms') attendeeForms: QueryList<DxFormComponent>;

  elements;
  items = [{ id: "xl-tshirt", amount: 1000 }];
  status: string = "REQUEST";
  countries = COUNTRIES;
  checkoutForm: CheckoutForm = {};

  public isOpenLogin = false;
  public isOpenCoupon = false;

  private ngUnsubscribe = new Subject<void>();

  constructor(private stripeService: StripeService, private toastrService: ToastrService, private shoppingCartService: ShoppingCartService, private authService: AuthService){}

  async ngOnInit(): Promise<void> {
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      this.status = "REQUEST"
    } else {
      this.status = "RESPONSE"
    }

    this.authService.getUser().pipe(takeUntil(this.ngUnsubscribe)).subscribe((user) => {
      const cartItem = this.shoppingCartService.getCartItem();
      const total = this.shoppingCartService.getTotal();
      this.checkoutForm.attendees = Array.from({ length: cartItem.quantity }, () => ({
        firstName: '',
        lastName: '',
        email: ''
      }));
      if(user) {
        Object.assign(this.checkoutForm, {
          eventId: cartItem.eventId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          location: user.address,
          phone: user.phone,
          attendees: [
            user, 
            ...(this.checkoutForm.attendees?.slice(1).map(() => ({})) || [])
          ],
          cartItem: cartItem,
          total: total
        })
      } else {
        Object.assign(this.checkoutForm, {
          eventId: cartItem.eventId,
          cartItem: cartItem,
          total: total
        })
      }
    });
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
    const isBillingValid = this.billingForm.instance.validate();
    let attendeeFormsValid = true;

    this.attendeeForms.forEach(form => {
      const result = form.instance.validate();
      if (!result.isValid) {
        attendeeFormsValid = false;
      }
    });
    if(isBillingValid && attendeeFormsValid) {
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
    } else if(!attendeeFormsValid) {
      notify({
        type: 'error',
        message: 'Please fill in information for all Attendees',
        width: '400',
        position: {
          my: 'top center', 
          at: 'top center', 
          of: window        
        }
      })
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
    this.shoppingCartService.clearCart();
  }

  handleOpenLogin() {
    this.isOpenLogin = !this.isOpenLogin;
  }
  handleOpenCoupon() {
    this.isOpenCoupon = !this.isOpenCoupon;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.shoppingCartService.clearCart();
  }

}
