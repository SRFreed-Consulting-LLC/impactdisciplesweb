import { AfterViewInit, Component } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { EventRegistrationModel } from 'impactdisciplescommon/src/models/domain/event-registration.model';
import { EventRegistrationService } from 'impactdisciplescommon/src/services/event-registration.service';
import { StripeService } from 'impactdisciplescommon/src/services/utils/stripe.service';
import { ToastrService } from 'ngx-toastr';
import { CartService } from 'src/app/shared/utils/services/cart.service';

@Component({
  selector: 'app-checkout-success',
  templateUrl: './checkout-success.component.html',
  styleUrls: ['./checkout-success.component.scss']
})
export class CheckoutSuccessComponent implements AfterViewInit{

  constructor(private stripeService: StripeService, public cartService: CartService, private eventRegistrationService: EventRegistrationService,
    private toastrService: ToastrService){}

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
        this.registerUsers(paymentIntent.id);
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
    messageContainer.textContent = messageText;
  }

  registerUsers(confirmationId){
    this.cartService.getCartProducts().forEach(product => {
      if(product.isEvent){
        product.attendees.forEach(async attendee => {
          let registration = {... new EventRegistrationModel()};
          registration.firstName = attendee.firstName;
          registration.lastName = attendee.lastName;
          registration.email = attendee.email;
          registration.receipt = confirmationId;
          registration.registrationDate = Timestamp.now();

          await this.eventRegistrationService.add(registration).then(registration => {
            this.toastrService.success(registration.firstName + ' ' + registration.lastName + ' (' + registration.email + ') Registered Successfully');
          })

          this.cartService.clearCartNoConfirmation();
        })
      }
    })
  }
}
