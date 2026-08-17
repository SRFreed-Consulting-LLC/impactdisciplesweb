import { Component } from '@angular/core';
import impactDisciplesInfo from '../utils/data/impact-disciples.data';
import { SubscriptionModel } from 'src/app/common/models/domain/subscription.model';
import { SubscriptionService } from 'src/app/common/services/data/subscription.service';
import { LoggerService } from 'src/app/common/services/data/logger.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})
export class FooterComponent {
  public impactDisciplesInfo = impactDisciplesInfo;

  subscription: SubscriptionModel = {... new SubscriptionModel(), type: 'newsletter'};

  constructor(
    private subscriptionService: SubscriptionService,
    private toastService: ToastService,
    private loggerService: LoggerService
  ){}

  // Was a raw this.subscriptionService.add(this.subscription) - a direct,
  // un-deduped Firestore write straight into the old `subscriptions`
  // collection, unlike every other subscribe form on the site (footer,
  // subscribe-area, prayer-team all had the same form, but only this one
  // skipped createSubscription()/sendConfirmationEmail() entirely - no
  // dedupe, no confirmation email). Aligned to the same pattern the other
  // 3 already use now that createSubscription() goes through the admin
  // repo's subscribe_to_email_list Cloud Function (see
  // subscription.service.ts's own comment) rather than a client-side write.
  handleFormSubmit() {
    this.subscriptionService.createSubscription('newsletter', this.subscription.firstName, this.subscription.lastName, this.subscription.email).then(sub => {
      if(sub){
        this.toastService.notify({ message: 'Subscription added Successfully!', type: 'success' });

        return sub;
      } else {
        this.toastService.notify({ message: 'Your email is already subscribed to our Newsletter!', type: 'info' });

        return null;
      }
    }).catch(err => {
      // createSubscription() throws on a failed request -- was previously
      // unhandled here, a genuinely silent failure with no user feedback.
      this.loggerService.logMessage(
        'NEWSLETTER_SUBSCRIBE', this.subscription.email, 'Failed to subscribe to the newsletter.', { err: String(err) }
      ).subscribe(errorCode => {
        this.toastService.notify({
          message: 'We could not complete your subscription. Please try again - reference code: ' + errorCode,
          type: 'error'
        });
      });
    });
    // Confirmation email is queued server-side by subscribe_to_email_list
    // now (pre-prod #1) - no client mail write.
  }
}
