import { formatDate } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { EMailModel } from 'src/app/common/models/admin/mail.model';
import { EventRegistrationModel } from 'src/app/common/models/domain/event-registration.model';
import { EventModel } from 'src/app/common/models/domain/event.model';
import { AffilliateSaleModel } from 'src/app/common/models/utils/affilliate-sale.model';
import { CartItem, CheckoutForm } from 'src/app/common/models/utils/cart.model';
import { AffilliateSalesService } from 'src/app/common/services/data/affiliate-sales.service';
import { EMailService } from 'src/app/common/services/data/email.service';
import { EventRegistrationService } from 'src/app/common/services/data/event-registration.service';
import { EventService } from 'src/app/common/services/data/event.service';
import { NewsletterSubscriptionService } from 'src/app/common/services/data/newsletter-subscription.service';
import { TaxRateSummaryService } from 'src/app/common/services/data/tax-rate-summary.service';
import { dateFromTimestamp } from 'src/app/common/utils/date-from-timestamp';
import { ImpactUserService } from 'src/app/shared/utils/services/impact-user.service';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-checkout-success',
    templateUrl: './checkout-success.component.html',
    styleUrls: ['./checkout-success.component.scss'],
    standalone: false
})
export class CheckoutSuccessComponent implements AfterViewInit{

  constructor(public cartService: CartService,
    private newsletterSubscriptionService: NewsletterSubscriptionService,
    private eventRegistrationService: EventRegistrationService,
    private impactService: ImpactUserService,
    private emailService: EMailService,
    private eventService: EventService,
    private affiliateSaleService: AffilliateSalesService,
    private taxSummaryService: TaxRateSummaryService,
    private toastService: ToastService){}

  async ngAfterViewInit() {
    let checkoutForm: CheckoutForm = JSON.parse(localStorage.getItem("checkoutForm"));

    if(checkoutForm){
      if(checkoutForm.isNewsletter){
        this.newsletterSubscriptionService.createNewsLetterSubscription(checkoutForm.firstName, checkoutForm.lastName, checkoutForm.email);
      }

      if(checkoutForm.couponCode){
        this.recordAffiliateSale(checkoutForm);
      }

      let events: CartItem[] = checkoutForm.cartItems.filter(item => item.isEvent);
      let products: CartItem[] = checkoutForm.cartItems.filter(item => !item.isEvent);
      let digitalBooks: CartItem[] = checkoutForm.cartItems.filter(item => item.isDigitalBook);

      let followUpEmails: CartItem[] = checkoutForm.cartItems.filter(item => item.followUpEmailId);


      if(digitalBooks.length > 0){
        this.impactService.registerImpactUser(checkoutForm)
      }

      if(events.length > 0){
        this.registerEventUsers(checkoutForm.payPalReceipt?.id? checkoutForm.payPalReceipt.id : checkoutForm.couponCode, events)
      }

      if(products.length > 0) {
        if(checkoutForm.total > 0){
          this.taxSummaryService.recordStateTaxesCollected(checkoutForm);
        }
        this.cartService.clearCartNoConfirmation();
      }

      if(followUpEmails.length > 0) {
        this.sendProductFollowUpEmail(checkoutForm, followUpEmails);
      }

      localStorage.removeItem('checkoutForm');
    }


  }

  recordAffiliateSale(checkoutForm:CheckoutForm) {
    let sale: AffilliateSaleModel = {... new AffilliateSaleModel()};
    sale.code = checkoutForm.couponCode;
    sale.date = Timestamp.now();
    sale.email = checkoutForm.email;
    sale.totalAfterDiscount = checkoutForm.total - checkoutForm.discount;
    sale.totalBeforeDiscount = checkoutForm.total;
    sale.receipt = checkoutForm.payPalReceipt?.id ? checkoutForm.payPalReceipt.id : '';
    this.affiliateSaleService.add(sale);
  }

  registerEventUsers(confirmationId, events: CartItem[]){
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
            this.sendRegistrationSuccessEmail(registration, event).then(email => {
              registration.receiptEmailId = email.id;
              return registration;
            }).then(registration => {
              this.eventRegistrationService.update(registration.id, registration);
            }).then(() => {
              this.toastService.notify({
                message: registration.firstName + ' ' + registration.lastName + ' (' + registration.email + ') Registered Successfully for ' + event.eventName +
                ' starting on ' + dateFromTimestamp(event.startDate),
                type: 'success'
              });

            });
          })
        })

        this.cartService.clearCartNoConfirmation();
      })
    })
  }

  sendRegistrationSuccessEmail(registration: EventRegistrationModel, event:EventModel): Promise<EMailModel>{
    let form = {};
    form['firstName'] = registration.firstName;
    form['lastName'] = registration.lastName;
    form['email'] = registration.email?.toLowerCase();
    form['eventName'] = event.eventName;
    form['startDate'] = formatDate(event.startDate as string, 'longDate', 'en-us') + " at " + formatDate(event.startDate as string, 'shortTime', 'en-US');
    form['editRegistration'] = "<a href='"+environment.domain+"/events/" + event.id + "/registrations/" +registration.id +"'>Register for Breakout</a>"

    return this.emailService.sendHTMLEMailFromTemplate(registration.email, event.emailTemplate, form);
  }

  sendProductFollowUpEmail(checkoutForm:CheckoutForm, followUpEmails: CartItem[]) {
    followUpEmails.forEach(followUp => {

      console.log('checkoutForm', checkoutForm)
      let form = {};
      form['firstName'] = checkoutForm.firstName;
      form['lastName'] = checkoutForm.lastName;
      form['email'] = checkoutForm.email?.toLowerCase();

      this.emailService.sendHTMLEMailByIdFromTemplate(checkoutForm.email, followUp.followUpEmailId, form);
    })
  }

  sendLibraryDownloadEmail(){

  }
}
