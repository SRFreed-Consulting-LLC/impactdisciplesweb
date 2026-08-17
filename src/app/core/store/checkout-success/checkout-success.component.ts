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
import { LoggerService } from 'src/app/common/services/data/logger.service';
import { SubscriptionService } from 'src/app/common/services/data/subscription.service';
import { dateFromTimestamp } from 'src/app/common/utils/date-from-timestamp';
import { ImpactUserService } from 'src/app/shared/utils/services/impact-user.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';
import { environment } from 'src/environments/environment';
import { CartService } from '../services/cart.service';

const CHECKOUT_STORAGE_KEY = 'checkoutForm';

// Copy of the original checkout-success.component.ts (which this module
// has now replaced -- see store-feature.module.ts). Two deliberate fixes vs.
// the original:
//  1. Cart-clearing happens once, unconditionally, after the side-effect
//     fan-out -- the original calls clearCartNoConfirmation() from three
//     separate branches (including once per event attendee in a loop).
//  2. Every side-effect call (newsletter, affiliate sale, digital-library
//     registration, tax summary, follow-up email) is now wrapped the same
//     way the original already wraps event registration and the order
//     save itself -- logged via LoggerService + a toast with a support
//     reference code, instead of being fire-and-forget promises with no
//     .catch at all.
@Component({
  selector: 'app-checkout-success',
  templateUrl: './checkout-success.component.html',
  styleUrls: ['./checkout-success.component.scss'],
  standalone: false
})
export class CheckoutSuccessComponent implements AfterViewInit {
  constructor(
    public cartService: CartService,
    private newsletterSubscriptionService: SubscriptionService,
    private eventRegistrationService: EventRegistrationService,
    private impactService: ImpactUserService,
    private emailService: EMailService,
    private eventService: EventService,
    private affiliateSaleService: AffilliateSalesService,
    private toastService: ToastService,
    private loggerService: LoggerService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    const checkoutForm: CheckoutForm = JSON.parse(localStorage.getItem(CHECKOUT_STORAGE_KEY));

    if (!checkoutForm) {
      return;
    }

    if (checkoutForm.isNewsletter) {
      this.runSideEffect(
        'NEWSLETTER_SUBSCRIBE',
        checkoutForm,
        () => this.newsletterSubscriptionService.createSubscription('newsletter', checkoutForm.firstName, checkoutForm.lastName, checkoutForm.email),
        'signing you up for the newsletter'
      );
    }

    if (checkoutForm.couponCode) {
      this.runSideEffect('AFFILIATE_SALE', checkoutForm, () => this.recordAffiliateSale(checkoutForm), 'recording your coupon/affiliate sale');
    }

    const events: CartItem[] = checkoutForm.cartItems.filter(item => item.isEvent);
    const digitalBooks: CartItem[] = checkoutForm.cartItems.filter(item => item.isDigitalBook);
    const followUpEmails: CartItem[] = checkoutForm.cartItems.filter(item => item.followUpEmailId);

    if (digitalBooks.length > 0) {
      this.runSideEffect('DIGITAL_LIBRARY_REGISTER', checkoutForm, () => this.impactService.registerImpactUser(checkoutForm), 'setting up your Digital Library access');
    }

    if (events.length > 0) {
      await this.registerEventUsers(checkoutForm.payPalReceipt?.id ? checkoutForm.payPalReceipt.id : checkoutForm.couponCode, events);
    }
    // TAX_SUMMARY side effect removed (pre-prod checklist #4): collected
    // sales tax now rolls into tax_rate_summaries SERVER-side via the
    // onPurchaseTaxSummary purchases trigger - no more anonymous client
    // read-modify-write of running totals (and no double-count on refresh).

    if (followUpEmails.length > 0) {
      this.sendProductFollowUpEmail(checkoutForm, followUpEmails);
    }

    // Once, unconditionally -- the original calls this from three separate
    // branches (including once per event attendee in a loop).
    this.cartService.clearCartNoConfirmation();
    localStorage.removeItem(CHECKOUT_STORAGE_KEY);
  }

  private runSideEffect(code: string, checkoutForm: CheckoutForm, action: () => Promise<unknown> | void, humanDescription: string): void {
    Promise.resolve(action()).catch(err => {
      this.loggerService.logMessage(
        code,
        checkoutForm.email,
        `Order was placed, but a follow-up step failed: ${humanDescription}.`,
        { err, receipt: checkoutForm.receipt }
      ).subscribe(errorCode => {
        this.toastService.notify({
          message: `Your order was placed, but we hit a problem ${humanDescription}. ` +
            'Please contact us so we can complete it manually - reference code: ' + errorCode,
          type: 'error'
        });
      });
    });
  }

  private recordAffiliateSale(checkoutForm: CheckoutForm): Promise<AffilliateSaleModel> {
    const sale: AffilliateSaleModel = { ...new AffilliateSaleModel() };
    sale.code = checkoutForm.couponCode;
    sale.date = Timestamp.now();
    sale.email = checkoutForm.email;
    sale.totalAfterDiscount = checkoutForm.total - checkoutForm.discount;
    sale.totalBeforeDiscount = checkoutForm.total;
    sale.receipt = checkoutForm.payPalReceipt?.id ? checkoutForm.payPalReceipt.id : '';
    return this.affiliateSaleService.add(sale);
  }

  private async registerEventUsers(confirmationId: string, events: CartItem[]): Promise<void> {
    for (const event of events) {
      for (const attendee of event.attendees ?? []) {
        const registration = { ...new EventRegistrationModel() };
        registration.eventId = event.id;
        registration.firstName = attendee.firstName;
        registration.lastName = attendee.lastName;
        registration.email = attendee.email.toLowerCase();
        registration.receipt = confirmationId;
        registration.registrationDate = Timestamp.now();

        try {
          const eventModel = await this.eventService.getById(event.id);
          const savedRegistration = await this.eventRegistrationService.add(registration);
          const emailResult = await this.sendRegistrationSuccessEmail(savedRegistration, eventModel);
          savedRegistration.receiptEmailId = emailResult.id;
          await this.eventRegistrationService.update(savedRegistration.id, savedRegistration);

          this.toastService.notify({
            message: registration.firstName + ' ' + registration.lastName + ' (' + registration.email + ') Registered Successfully for ' + eventModel.eventName +
              ' starting on ' + dateFromTimestamp(eventModel.startDate),
            type: 'success'
          });
        } catch (err) {
          this.loggerService.logMessage(
            'EVENT_REGISTRATION_NEW',
            registration.email,
            'Failed to register attendee for event after checkout succeeded.',
            { err, eventId: event.id, eventName: event.itemName, confirmationId }
          ).subscribe(errorCode => {
            this.toastService.notify({
              message: 'Your order was placed, but we hit a problem registering ' + registration.firstName + ' ' + registration.lastName +
                ' for ' + event.itemName + '. Please contact us to complete this registration - reference code: ' + errorCode,
              type: 'error'
            });
          });
        }
      }
    }
  }

  private sendRegistrationSuccessEmail(registration: EventRegistrationModel, event: EventModel): Promise<EMailModel> {
    const form = {};
    form['firstName'] = registration.firstName;
    form['lastName'] = registration.lastName;
    form['email'] = registration.email?.toLowerCase();
    form['eventName'] = event.eventName;
    form['startDate'] = formatDate(event.startDate as string, 'longDate', 'en-us') + ' at ' + formatDate(event.startDate as string, 'shortTime', 'en-US');
    form['editRegistration'] = "<a href='" + environment.domain + '/events/' + event.id + '/registrations/' + registration.id + "'>Register for Breakout</a>";

    return this.emailService.sendHTMLEMailFromTemplate(registration.email, event.emailTemplate, form);
  }

  private sendProductFollowUpEmail(checkoutForm: CheckoutForm, followUpEmails: CartItem[]): void {
    followUpEmails.forEach(followUp => {
      const form = {};
      form['firstName'] = checkoutForm.firstName;
      form['lastName'] = checkoutForm.lastName;
      form['email'] = checkoutForm.email?.toLowerCase();

      this.runSideEffect(
        'FOLLOW_UP_EMAIL',
        checkoutForm,
        () => this.emailService.sendHTMLEMailByIdFromTemplate(checkoutForm.email, followUp.followUpEmailId, form),
        'sending a follow-up email'
      );
    });
  }
}
