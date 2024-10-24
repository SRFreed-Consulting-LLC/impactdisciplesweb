import { AfterViewInit, Component } from '@angular/core';
import { PaymentIntent } from '@stripe/stripe-js';
import { Timestamp } from 'firebase/firestore';
import { EventRegistrationModel } from 'impactdisciplescommon/src/models/domain/event-registration.model';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { AffilliateSaleModel } from 'impactdisciplescommon/src/models/utils/affilliate-sale.model';
import { AffilliateSalesService } from 'impactdisciplescommon/src/services/data/affiliate-sales.service';
import { EMailService } from 'impactdisciplescommon/src/services/data/email.service';
import { EventRegistrationService } from 'impactdisciplescommon/src/services/data/event-registration.service';
import { EventService } from 'impactdisciplescommon/src/services/data/event.service';
import { SalesService } from 'impactdisciplescommon/src/services/data/sales.service';
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

  saleId: string;

  constructor(private stripeService: StripeService,
    public cartService: CartService,
    private eventRegistrationService: EventRegistrationService,
    private emailService: EMailService,
    private eventService: EventService,
    private salesService: SalesService,
    private affiliateSaleService: AffilliateSalesService,
    private toastrService: ToastrService){}

  async ngAfterViewInit() {
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    this.saleId = new URLSearchParams(window.location.search).get(
      "savedForm"
    );

    if (clientSecret) {
      const { paymentIntent } = await this.stripeService.getStripe().then(async stripe => {
        return await stripe.retrievePaymentIntent(clientSecret);
      })


      switch (paymentIntent.status) {
        case "succeeded":
          await this.updateSale(paymentIntent).then(() => {
            this.showMessage("Payment succeeded!");
            this.registerUsers(paymentIntent.id);
          });
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
    } else {
      await this.updateSale("COUPON").then(cart => {
        this.showMessage("You have been successfully Registered!");
        this.registerUsers(cart.couponCode);
      });
    }
  }

  showMessage(messageText) {
    const messageContainer = document.querySelector("#payment-message");
    messageContainer.textContent = messageText;
  }

  async updateSale(paymentIntent: PaymentIntent | string){
    //send email
    return await this.salesService.getById(this.saleId).then(async cart => {
      cart.dateProcessed = Timestamp.now();
      cart.paymentIntent = paymentIntent;

      if(cart.couponCode){
        let sale: AffilliateSaleModel = {... new AffilliateSaleModel()};
        sale.code = cart.couponCode;
        sale.date = Timestamp.now();
        sale.email = cart.email;
        sale.totalAfterDiscount = cart.total;
        sale.totalBeforeDiscount = cart.totalBeforeDiscount;
        sale.receipt = paymentIntent;
        await this.affiliateSaleService.add(sale);
      }

      return await this.salesService.update(cart.id, cart);
    })
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
                ' starting on ' + dateFromTimestamp(event.startDate as Timestamp).toDateString()
              );

              this.sendRegistrationSuccessEmail(registration, event);
            })
          })

          this.cartService.clearCartNoConfirmation();
        })
      }
    })
  }

  sendRegistrationSuccessEmail(registration: EventRegistrationModel, event:EventModel){
    let form = {};
    form['firstName'] = registration.firstName;
    form['lastName'] = registration.lastName;
    form['email'] = registration.email;
    form['eventName'] = event.eventName;
    form['startDate'] = dateFromTimestamp(event.startDate as Timestamp).toDateString();

    this.emailService.sendTemplateEmail(registration.email, event.emailTemplate, form);
  }
}
