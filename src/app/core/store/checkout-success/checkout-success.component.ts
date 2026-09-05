import { AfterViewInit, Component } from '@angular/core';
import { CartItem, CheckoutForm } from '@impact-common/shared/models/utils/cart.model';
import { EventModel } from '@impact-common/shared/models/domain/event.model';
import { EventRegistrationService } from 'src/app/common/services/data/event-registration.service';
import { EventService } from 'src/app/common/services/data/event.service';
import { LoggerService } from 'src/app/common/services/data/logger.service';
import { SubscriptionService } from 'src/app/common/services/data/subscription.service';
import { dateFromTimestamp } from '@impact-common/shared/utils/date-from-timestamp';
import { ToastService } from 'src/app/shared/utils/services/toast.service';
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
    private eventService: EventService,
    private toastService: ToastService,
    private loggerService: LoggerService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    // Handed off from CheckoutComponent.finishCheckout() via sessionStorage
    // (same-tab only, cleared below once consumed) - this is checkout PII,
    // so it must never sit in persistent/cross-tab localStorage. The
    // localStorage.removeItem below just sweeps up any copy left behind by
    // builds that stored it there.
    localStorage.removeItem(CHECKOUT_STORAGE_KEY);
    const checkoutForm: CheckoutForm | null = JSON.parse(sessionStorage.getItem(CHECKOUT_STORAGE_KEY) ?? 'null');

    if (!checkoutForm) {
      return;
    }

    if (checkoutForm.isNewsletter) {
      this.runSideEffect(
        'NEWSLETTER_SUBSCRIBE',
        checkoutForm,
        () => this.newsletterSubscriptionService.createSubscription('newsletter', checkoutForm.firstName ?? '', checkoutForm.lastName ?? '', checkoutForm.email ?? ''),
        'signing you up for the newsletter'
      );
    }

    // Affiliate/coupon sale is recorded server-side by the checkout Cloud
    // Function now (sweep fix) - the client no longer writes
    // affilliate_sales (that write required an anonymous-create rule that
    // let anyone forge attribution).

    const events: CartItem[] = (checkoutForm.cartItems ?? []).filter(item => item.isEvent);
    // DIGITAL_LIBRARY_REGISTER side effect removed (pre-prod checklist #3):
    // the legacy impact-users license store is retired - digital-book access
    // is granted into libraryUsers by the onPurchaseGrantLibraryLicenses
    // trigger the moment the purchase doc lands, entirely server-side.
    // NOTE for the eventual PROD cutover: the OLD production library (if
    // still serving anyone from impact-users) stops receiving grants once
    // this build reaches production - by then the new reader app must be
    // the live one.

    if (events.length > 0) {
      await this.registerEventUsers(checkoutForm.payPalReceipt?.id ? checkoutForm.payPalReceipt.id : (checkoutForm.couponCode ?? ''), events, checkoutForm.email ?? '');
    }
    // TAX_SUMMARY side effect removed (pre-prod checklist #4): collected
    // sales tax now rolls into tax_rate_summaries SERVER-side via the
    // onPurchaseTaxSummary purchases trigger - no more anonymous client
    // read-modify-write of running totals (and no double-count on refresh).

    // Product follow-up emails are queued server-side when the order
    // saves now (pre-prod #1) - no client mail write.

    // Once, unconditionally -- the original calls this from three separate
    // branches (including once per event attendee in a loop).
    this.cartService.clearCartNoConfirmation();
    // PII handoff consumed - delete it so the receipt/addresses don't
    // outlive this page.
    sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
  }

  private runSideEffect(code: string, checkoutForm: CheckoutForm, action: () => Promise<unknown> | void, humanDescription: string): void {
    Promise.resolve(action()).catch(err => {
      this.loggerService.logMessage(
        code,
        checkoutForm.email ?? '',
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

  private async registerEventUsers(confirmationId: string, events: CartItem[], purchaserEmail: string): Promise<void> {
    for (const event of events) {
      // Hoisted out of the attendee loop below -- event.id doesn't change
      // per attendee, so this used to re-fetch the identical event doc
      // once per attendee (a group registration of N people did N
      // redundant reads instead of 1) purely to read eventName/startDate
      // for the success toast.
      // A cart line is a product document and always carries its id.
      let eventModel: EventModel;
      try {
        const found = await this.eventService.getById(event.id!);
        if (!found) {
          throw new Error(`event ${event.id} not found`);
        }
        eventModel = found;
      } catch (err) {
        this.loggerService.logMessage(
          'EVENT_REGISTRATION_NEW',
          purchaserEmail,
          'Failed to load event details after checkout succeeded; attendees for this event were not registered.',
          { err, eventId: event.id, confirmationId }
        ).subscribe();
        continue;
      }

      for (const attendee of event.attendees ?? []) {
        try {
          // Pre-prod #2: one register_for_event Cloud Function call
          // replaces the old client-side create -> template email ->
          // receipt-stamp chain (the function does all three server-side,
          // including the confirmation email with the breakout link -
          // whose domain is pinned server-side, not client-supplied).
          await this.eventRegistrationService.registerForEvent({
            eventId: event.id!,
            firstName: attendee.firstName,
            lastName: attendee.lastName,
            email: attendee.email,
            receipt: confirmationId,
          });

          this.toastService.notify({
            message: attendee.firstName + ' ' + attendee.lastName + ' (' + attendee.email.toLowerCase() + ') Registered Successfully for ' + eventModel.eventName +
              ' starting on ' + dateFromTimestamp(eventModel.startDate),
            type: 'success'
          });
        } catch (err) {
          this.loggerService.logMessage(
            'EVENT_REGISTRATION_NEW',
            attendee.email,
            'Failed to register attendee for event after checkout succeeded.',
            { err, eventId: event.id, eventName: event.itemName, confirmationId }
          ).subscribe(errorCode => {
            this.toastService.notify({
              message: 'Your order was placed, but we hit a problem registering ' + attendee.firstName + ' ' + attendee.lastName +
                ' for ' + event.itemName + '. Please contact us to complete this registration - reference code: ' + errorCode,
              type: 'error'
            });
          });
        }
      }
    }
  }

}
