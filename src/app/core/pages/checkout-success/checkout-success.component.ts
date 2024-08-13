import { AfterContentInit, AfterViewInit, Component, OnInit } from '@angular/core';
import { StripeService } from '../checkout/stripe.service';

@Component({
  selector: 'app-checkout-success',
  templateUrl: './checkout-success.component.html',
  styleUrls: ['./checkout-success.component.css']
})
export class CheckoutSuccessComponent implements AfterViewInit{
  constructor(private stripeService: StripeService){}

  async ngAfterViewInit() {
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
        this.showMessage("Payment succeeded!");
        break;
      case "processing":
        this.showMessage("Your payment is processing.");
        break;
      case "requires_payment_method":
        this.showMessage("Your payment was not successful, please try again.");
        break;
      default:
        this.showMessage("Something went wrong.");
        break;
    }
  }

  showMessage(messageText) {
    const messageContainer = document.querySelector("#payment-message");

    messageContainer.classList.remove("hidden");
    messageContainer.textContent = messageText;

    setTimeout(function () {
      messageContainer.classList.add("hidden");
      messageContainer.textContent = "";
    }, 4000);
  }
}
