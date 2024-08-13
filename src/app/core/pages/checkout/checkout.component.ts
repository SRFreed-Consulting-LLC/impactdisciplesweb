import { AfterContentInit, Component, OnInit } from '@angular/core';
import { StripeService } from './stripe.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, AfterContentInit {
  elements;

  items = [{ id: "xl-tshirt", amount: 1000 }];

  status: string = "REQUEST";

  constructor(private stripeService: StripeService, private toastrService: ToastrService){}

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

  async ngAfterContentInit(): Promise<void> {
    if(this.status === "RESPONSE"){
      this.checkStatus();
    } else {
      document.querySelector("#payment-form").addEventListener("submit", this.handleSubmit.bind(this));

      const response = await fetch("https://us-central1-impactdisciples-a82a8.cloudfunctions.net/checkout/create-payment-intent", {
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
    e.preventDefault();
    this.setLoading(true);

    let response = await this.stripeService.getStripe().then(async stripe => {
      return await stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          // Make sure to change this to your payment completion page
          return_url: "http://localhost:4200/checkout",
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

}
