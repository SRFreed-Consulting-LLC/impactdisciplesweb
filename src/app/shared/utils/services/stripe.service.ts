import { Injectable } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { CheckoutForm } from 'src/app/common/models/utils/cart.model';
import { ToastService } from 'src/app/shared/utils/services/toast.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StripeService {

  private stripe: Promise<Stripe>;

  constructor(private toastService: ToastService) {
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
    const response = await this.getStripe().then(async stripe => {
      return await stripe.confirmPayment({
        elements: elements,
        confirmParams: {
          return_url: environment.domain + "/checkout-success?savedForm=" + savedForm.id,
        },
      })
    })

    if (response.error.type === "card_error" || response.error.type === "validation_error") {
      this.toastService.notify({ message: response.error.message, type: 'error' });
    } else {
      this.toastService.notify({ message: "An unexpected error occurred.", type: 'error' });
    }
  }
}
