import { AfterViewInit, Component, OnInit } from '@angular/core';
import { StripeService } from 'impactdisciplescommon/src/services/utils/stripe.service';
import { ToastrService } from 'ngx-toastr';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-give',
  templateUrl: './give.component.html',
  styleUrls: ['./give.component.scss']
})
export class GiveComponent implements OnInit {
  public impactDisciplesInfo = impactDisciplesInfo;
  isFormVisible: string = ''; 
  status: string = "REQUEST";
  elements;
  items = [{ id: "xl-tshirt", amount: 1000 }];
  loading: boolean = false;
  oneTimeAmount: number = 0;
  monthlyAmount: number = 0;

  constructor (
    private stripeService: StripeService,
    private toastrService: ToastrService,
    public cartService: CartService
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
  }

  async initializeStripeForm(): Promise<void> {
    try {
      if (this.status === "RESPONSE") {
        this.checkStatus();
      } else {
        setTimeout(async () => {
          const paymentForm = document.querySelector("#payment-form");
          if (paymentForm) {
            paymentForm.addEventListener("submit", this.handleSubmit.bind(this));
  
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
  
            // Set loading to false once form is ready
            this.loading = false;
          }
        }, 0);  // Ensures form is rendered before Stripe is initialized
      }
    } catch (error) {
      console.error('Error initializing Stripe form:', error);
      this.loading = false;  // Ensure loading is set to false even if there is an error
      this.showMessage('Failed to load payment form. Please try again.', 'ERROR');
    }
  }

  async handleSubmit(e) {
    // TODO: validate give forms
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
  }

  togglePaymentForm(formType: string): void {
    if (this.isFormVisible === formType) {
      this.isFormVisible = '';  // Close if the same form is clicked again
    } else {
      this.isFormVisible = formType;  // Show the selected form
      this.loading = true;
      this.initializeStripeForm(); 
    }
  }
}