import { AfterViewInit, Component } from '@angular/core';
import { PaymentIntent } from '@stripe/stripe-js';
import { Timestamp } from 'firebase/firestore';
import { EventRegistrationModel } from 'impactdisciplescommon/src/models/domain/event-registration.model';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { AffilliateSaleModel } from 'impactdisciplescommon/src/models/utils/affilliate-sale.model';
import { CartItem, CheckoutForm } from 'impactdisciplescommon/src/models/utils/cart.model';
import { EMailService } from 'impactdisciplescommon/src/services/admin/email.service';
import { EventRegistrationService } from 'impactdisciplescommon/src/services/event-registration.service';
import { EventService } from 'impactdisciplescommon/src/services/event.service';
import { AffilliateSalesService } from 'impactdisciplescommon/src/services/utils/affiliate-sales.service';
import { SalesService } from 'impactdisciplescommon/src/services/utils/sales.service';
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

    //clientSecret will exist if payment sent to Stripe
    if (clientSecret) {
      const { paymentIntent } = await this.stripeService.getStripe().then(async stripe => {
        return await stripe.retrievePaymentIntent(clientSecret);
      })

      await this.recordSale(paymentIntent).then(cart => {
        switch (paymentIntent.status) {
          case "succeeded":
            this.showMessage("Payment succeeded!");
            this.confirmSale(paymentIntent.id, cart);
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
      })
    } else {
      await this.recordSale().then(cart => {
        this.showMessage("You have been successfully Registered!");
        this.confirmSale(cart.couponCode, cart);
      });
    }
  }

  showMessage(messageText) {
    const messageContainer = document.querySelector("#payment-message");
    messageContainer.textContent = messageText;
  }

  //record sale
  async recordSale(paymentIntent?: PaymentIntent){
    return await this.salesService.getById(this.saleId).then(async cart => {
      cart.dateProcessed = Timestamp.now();
      cart.paymentIntent = paymentIntent? paymentIntent: null;
      cart.receipt = paymentIntent?.id ? paymentIntent.id : ''

      if(cart.couponCode){
        let sale: AffilliateSaleModel = {... new AffilliateSaleModel()};
        sale.code = cart.couponCode;
        sale.date = Timestamp.now();
        sale.email = cart.email;
        sale.totalAfterDiscount = cart.total;
        sale.totalBeforeDiscount = cart.totalBeforeDiscount;
        sale.receipt = paymentIntent?.id ? paymentIntent.id : '';
        await this.affiliateSaleService.add(sale);
      }

      return await this.salesService.update(cart.id, cart);
    })
  }

  confirmSale(confirmationId, cart: CheckoutForm){
    let events: CartItem[] = [];
    let products: CartItem[] = []

    cart.cartItems.forEach(item => {
      if(item.isEvent){
        events.push(item)
      } else {
        products.push(item)
      }
    })

    if(events.length > 0){
      this.registerUsers(confirmationId, cart, events)
    }

    if(products.length > 0) {
      this.sendProductPurchaseSuccessEmail(cart);
      this.cartService.clearCartNoConfirmation()
    }
  }

  registerUsers(confirmationId, cart: CheckoutForm, events: CartItem[]){
    events.forEach(event => {
      event.attendees.forEach(async attendee => {
        let registration = {... new EventRegistrationModel()};
        registration.eventId = event.id;
        registration.firstName = attendee.firstName;
        registration.lastName = attendee.lastName;
        registration.email = attendee.email;
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

  sendProductPurchaseSuccessEmail(cart: CheckoutForm){
    let subject = 'Thank you for Your Purchase ';
    let text = 'You have purchased the following: \n\n'

    this.cartService.getCartProducts().forEach(product => {
      text += product.orderQuantity + '  x  ' + product.itemName + ' for $' + (product.orderQuantity * product.price) + '\n';
    })


    if(cart.couponCode) {
      text += 'Subtotal: $' + cart.totalBeforeDiscount + ' \n \n'
      text += 'Applied Coupon: ' + cart.couponCode + ' \n \n';
      text += 'Total: $' + cart.total + ' \n \n'
    } else {
      text += 'Total: $' + cart.total + ' \n \n'
    }

    text += 'Confirmation Id: ' + cart.receipt + '\n'

    this.emailService.sendTextEmail(cart.email, subject, text);
  }
}
