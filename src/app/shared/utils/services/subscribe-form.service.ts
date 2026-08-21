import { Injectable } from '@angular/core';
import { SubscriptionType } from 'src/app/common/models/domain/subscription.model';
import { SubscriptionService } from 'src/app/common/services/data/subscription.service';
import { LoggerService } from 'src/app/common/services/data/logger.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';

// The one subscribe submit flow (bucket A, web item 1, 2026-08-21).
//
// The footer, the subscribe-area block and the prayer-team page each
// carried their own copy of this ~30-line handler. The copies differed
// only in the five strings below, so a change to the flow - the
// already-subscribed branch, the error logging, the reference code shown
// to the visitor - had to be made three times and had already been made
// inconsistently once (the footer used to write straight to Firestore,
// skipping dedupe and the confirmation email entirely).
//
// Deliberately NOT a shared component. The refactor sweep proposed one
// SubscribeFormComponent replacing all three, but the three TEMPLATES are
// genuinely different designs - the footer is a compact inline row with
// placeholders, subscribe-area is a centred stacked block, prayer-team has
// labelled fields with required markers and its own button copy. Unifying
// that markup would be a visual redesign of three live public pages, not a
// refactor. Only the logic was duplicated, so only the logic moved here.
//
// Lives beside ToastService rather than on SubscriptionService because it
// owns user-facing concerns (toasts, error copy) - SubscriptionService is
// a data service and should stay one.

interface SubscribeCopy {
  /** Shown when the address was newly subscribed. */
  success: string;
  /** Shown when the Cloud Function reported alreadySubscribed. */
  already: string;
  /** LogMessage `type` - what this failure is called in the log screen. */
  logCode: string;
  /** LogMessage `message` - the human sentence stored with it. */
  logMessage: string;
  /** Error toast, with the log's reference code appended. */
  errorPrefix: string;
}

const COPY: Record<SubscriptionType, SubscribeCopy> = {
  newsletter: {
    success: 'Subscription added Successfully!',
    already: 'Your email is already subscribed to our Newsletter!',
    logCode: 'NEWSLETTER_SUBSCRIBE',
    logMessage: 'Failed to subscribe to the newsletter.',
    errorPrefix: 'We could not complete your subscription. Please try again - reference code: '
  },
  prayer: {
    success: 'Prayer Team Subscription added Successfully!',
    already: 'Your email is already a member of our Prayer Team!',
    logCode: 'PRAYER_TEAM_SUBSCRIBE',
    logMessage: 'Failed to join the prayer team.',
    // "submission", not "subscription" - joining the prayer team is not
    // framed as subscribing to a list anywhere in that page's copy.
    errorPrefix: 'We could not complete your submission. Please try again - reference code: '
  }
};

/** The fields a subscribe form collects, whatever model it holds them in. */
export interface SubscriberDetails {
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscribeFormService {
  constructor(
    private subscriptionService: SubscriptionService,
    private toastService: ToastService,
    private loggerService: LoggerService
  ) {}

  /**
   * Subscribes an address and reports the outcome to the visitor.
   *
   * Never rejects: a failed request is logged and surfaced as an error
   * toast carrying the log's reference code, so a caller can bind this
   * straight to (ngSubmit) without its own error handling.
   */
  submit(type: SubscriptionType, subscriber: SubscriberDetails): Promise<void> {
    const copy = COPY[type];

    return this.subscriptionService.createSubscription(
      type, subscriber.firstName, subscriber.lastName, subscriber.email
    ).then(sub => {
      this.toastService.notify(
        sub ?
          { message: copy.success, type: 'success' } :
          { message: copy.already, type: 'info' }
      );
    }).catch(err => {
      // createSubscription() throws on a failed request. Before this was
      // centralized the footer swallowed it entirely - a genuinely silent
      // failure with no user feedback.
      this.loggerService.logMessage(
        copy.logCode, subscriber.email, copy.logMessage, { err: String(err) }
      ).subscribe(errorCode => {
        this.toastService.notify({
          message: copy.errorPrefix + errorCode,
          type: 'error'
        });
      });
    });
    // The confirmation email is queued server-side by
    // subscribe_to_email_list - no client mail write.
  }
}
