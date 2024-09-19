import { AfterViewInit, Component } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { EventRegistrationModel } from 'impactdisciplescommon/src/models/domain/event-registration.model';
import { EMailService } from 'impactdisciplescommon/src/services/admin/email.service';
import { EventRegistrationService } from 'impactdisciplescommon/src/services/event-registration.service';
import { EventService } from 'impactdisciplescommon/src/services/event.service';
import { StripeService } from 'impactdisciplescommon/src/services/utils/stripe.service';
import { dateFromTimestamp } from 'impactdisciplescommon/src/utils/date-from-timestamp';
import { ToastrService } from 'ngx-toastr';
import { CartService } from 'src/app/shared/utils/services/cart.service';

@Component({
  selector: 'app-registration-checkout-success',
  templateUrl: './registration-checkout-success.component.html',
  styleUrls: ['./registration-checkout-success.component.scss']
})
export class RegistrationCheckoutSuccessComponent implements AfterViewInit{

  constructor(private stripeService: StripeService, public cartService: CartService, private eventRegistrationService: EventRegistrationService,
    private emailService: EMailService, private eventService: EventService, private toastrService: ToastrService){}

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
          registration.eventId = product.id;
          registration.firstName = attendee.firstName;
          registration.lastName = attendee.lastName;
          registration.email = attendee.email;
          registration.receipt = confirmationId;
          registration.registrationDate = Timestamp.now();

          await this.eventService.getById(product.id).then(async event => {
            await this.eventRegistrationService.add(registration).then(registration => {
              this.toastrService.success(registration.firstName + ' ' + registration.lastName + ' (' + registration.email + ') Registered Successfully for ' + event.eventName +
                ' starting on ' + dateFromTimestamp(event.startDate)
              );

              let subject = 'You have been registered for an event!';
              let text = 'You have been registered for ' + event.eventName + ' starting on ' + dateFromTimestamp(event.startDate) + ', Your confirmationId is ' + registration.receipt;
              let to = registration.email;

              this.emailService.sendTextEmail(to, subject, text);
            })
          })

          this.cartService.clearCartNoConfirmation();
        })
      }
    })
  }
}
