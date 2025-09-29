import { Injectable } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import notify from 'devextreme/ui/notify';
import { CheckoutForm } from 'impactdisciplescommon/src/models/utils/cart.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StripeService {

  private stripe: Promise<Stripe>;

  constructor() {
    this.stripe = loadStripe(environment.stripeKey);
  }

  async getStripe(): Promise<Stripe>{
    if(this.stripe){
      return this.stripe;
    } else {
      return loadStripe(environment.stripeKey);
    }
  }

  async cancelStripeIntent(paymentIntent: string){
    if(paymentIntent){
      await fetch(environment.stripeCancelURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 'paymentIntent': paymentIntent })
      });
    }
  }

  async submitStripePayment(savedForm: CheckoutForm, elements){
    let response = await this.getStripe().then(async stripe => {
      return await stripe.confirmPayment({
        elements: elements,
        confirmParams: {
          return_url: environment.domain + "/checkout-success?savedForm=" + savedForm.id,
        },
      })
    })

    if (response.error.type === "card_error" || response.error.type === "validation_error") {
      notify({
        message: response.error.message,
        width: 600,
        type: 'error'
      });
    } else {
      notify({
        message: "An unexpected error occurred.",
        width: 600,
        type: 'error'
      });
    }
  }
}
