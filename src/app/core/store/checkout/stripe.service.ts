import { Injectable } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';

@Injectable({
  providedIn: 'root'
})
export class StripeService {

  private stripe: Promise<Stripe>;

  constructor() {
    this.stripe = loadStripe("pk_test_51Pn1LoCnBBfbRmrnWBnYBDBalTeO4ap8IX1B0VidrP3HV5fLT9DdF4eDPkEsh84r83ENuRUcBCiEIxlSZb6foV9x00RTu62q46");
  }

  async getStripe(): Promise<Stripe>{
    if(this.stripe){
      return this.stripe;
    } else {
      return loadStripe("pk_test_51Pn1LoCnBBfbRmrnWBnYBDBalTeO4ap8IX1B0VidrP3HV5fLT9DdF4eDPkEsh84r83ENuRUcBCiEIxlSZb6foV9x00RTu62q46");;
    }
  }
}
