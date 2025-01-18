import { AfterViewInit, Component } from '@angular/core';
import { PaymentIntent } from '@stripe/stripe-js';
import { Timestamp } from 'firebase/firestore';

import { EventRegistrationModel } from 'impactdisciplescommon/src/models/domain/event-registration.model';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { AffilliateSaleModel } from 'impactdisciplescommon/src/models/utils/affilliate-sale.model';
import { CartItem, CheckoutForm } from 'impactdisciplescommon/src/models/utils/cart.model';
import { AffilliateSalesService } from 'impactdisciplescommon/src/services/data/affiliate-sales.service';
import { EMailService } from 'impactdisciplescommon/src/services/data/email.service';
import { EventRegistrationService } from 'impactdisciplescommon/src/services/data/event-registration.service';
import { EventService } from 'impactdisciplescommon/src/services/data/event.service';
import { NewsletterSubscriptionService } from 'impactdisciplescommon/src/services/data/newsletter-subscription.service';
import { SalesService } from 'impactdisciplescommon/src/services/data/sales.service';
import { TaxRateSummaryService } from 'impactdisciplescommon/src/services/data/tax-rate-summary.service';
import { StripeService } from 'impactdisciplescommon/src/services/utils/stripe.service';
import { dateFromTimestamp } from 'impactdisciplescommon/src/utils/date-from-timestamp';
import { ToastrService } from 'ngx-toastr';
import { CartService } from 'src/app/shared/utils/services/cart.service';

@Component({
  selector: 'app-checkout-success',
  templateUrl: './checkout-success.component.html',
  styleUrls: ['./checkout-success.component.scss']
})
export class CheckoutSuccessComponent implements AfterViewInit{

  constructor(private stripeService: StripeService,
    public cartService: CartService,
    private newsletterSubscriptionService: NewsletterSubscriptionService,
    private eventRegistrationService: EventRegistrationService,
    private emailService: EMailService,
    private eventService: EventService,
    private salesService: SalesService,
    private affiliateSaleService: AffilliateSalesService,
    private taxSummaryService: TaxRateSummaryService,
    private toastrService: ToastrService){}

  async ngAfterViewInit() {
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    let checkoutForm: CheckoutForm = JSON.parse(localStorage.getItem("checkoutForm"));

    //only process if checkoutForm exists
    if(checkoutForm){
      //clientSecret will exist if payment sent to Stripe
      if (clientSecret) {
        const { paymentIntent } = await this.stripeService.getStripe().then(async stripe => {
          return await stripe.retrievePaymentIntent(clientSecret);
        })

        switch (paymentIntent.status) {
          case "succeeded":
            checkoutForm.paymentIntent = paymentIntent
            checkoutForm.receipt = paymentIntent.id;

            this.processSale(checkoutForm, paymentIntent);
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
        checkoutForm.paymentIntent = null;
        checkoutForm.receipt = 'COUPON';

        this.processSale(checkoutForm);
      }
    }
  }

  processSale(checkoutForm: CheckoutForm, paymentIntent?: PaymentIntent){
    let events: CartItem[] = checkoutForm.cartItems.filter(item => item.isEvent);
    let products: CartItem[] = checkoutForm.cartItems.filter(item => !item.isEvent);

    if(events.length > 0){
      this.registerUsers(paymentIntent.id, checkoutForm, events)
    }

    if(products.length > 0) {
      this.taxSummaryService.recordStateTaxesCollected(checkoutForm);
      this.cartService.clearCartNoConfirmation();
    }

    this.salesService.add(checkoutForm).then(checkoutForm => {
      if(checkoutForm.isNewsletter){
        this.newsletterSubscriptionService.createNewsLetterSubscription(checkoutForm.firstName, checkoutForm.lastName, checkoutForm.email);
      }

      if(checkoutForm.couponCode){
        this.recordAffiliateSale(checkoutForm, paymentIntent);
      }

      localStorage.removeItem('checkoutForm');
    })

  }

  recordAffiliateSale(cart:CheckoutForm, paymentIntent?: PaymentIntent){
    let sale: AffilliateSaleModel = {... new AffilliateSaleModel()};
    sale.code = cart.couponCode;
    sale.date = Timestamp.now();
    sale.email = cart.email;
    sale.totalAfterDiscount = cart.total;
    sale.totalBeforeDiscount = cart.totalBeforeDiscount;
    sale.receipt = paymentIntent?.id ? paymentIntent.id : '';
    this.affiliateSaleService.add(sale);
  }

  registerUsers(confirmationId, cart: CheckoutForm, events: CartItem[]){
    events.forEach(event => {
      event.attendees.forEach(async attendee => {
        let registration = {... new EventRegistrationModel()};
        registration.eventId = event.id;
        registration.firstName = attendee.firstName;
        registration.lastName = attendee.lastName;
        registration.email = attendee.email.toLowerCase();
        registration.receipt = confirmationId;
        registration.registrationDate = Timestamp.now();

        await this.eventService.getById(event.id).then(async event => {
          await this.eventRegistrationService.add(registration).then(registration => {
            this.toastrService.success(registration.firstName + ' ' + registration.lastName + ' (' + registration.email + ') Registered Successfully for ' + event.eventName +
              ' starting on ' + dateFromTimestamp(event.startDate)
            );

            this.sendRegistrationSuccessEmail(registration, event);
          })
        })

        this.cartService.clearCartNoConfirmation();
      })
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

  showMessage(messageText) {
    const messageContainer = document.querySelector("#payment-message");
    messageContainer.textContent = messageText;
  }
}
