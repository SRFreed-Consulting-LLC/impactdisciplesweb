import { Component } from '@angular/core';
import { SubscriptionModel } from 'src/app/common/models/domain/subscription.model';
import { SubscriptionService } from 'src/app/common/services/data/subscription.service';
import { LoggerService } from 'src/app/common/services/data/logger.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';

@Component({
    selector: 'app-prayer-team',
    templateUrl: './prayer-team.component.html',
    styleUrls: ['./prayer-team.component.scss'],
    standalone: false
})
export class PrayerTeamComponent {
  prayerTeamSubscription: SubscriptionModel = {... new SubscriptionModel(), type: 'prayer'};

  constructor(
    private prayerTeamSubscriptionService: SubscriptionService,
    private toastService: ToastService,
    private loggerService: LoggerService
  ){}

  handleFormSubmit() {
    this.prayerTeamSubscriptionService.createSubscription('prayer', this.prayerTeamSubscription.firstName, this.prayerTeamSubscription.lastName, this.prayerTeamSubscription.email).then(sub => {
      if(sub){
        this.toastService.notify({ message: 'Prayer Team Subscription added Successfully!', type: 'success' });

        return sub;
      } else {
        this.toastService.notify({ message: 'Your email is already a member of our Prayer Team!', type: 'info' });

        return null;
      }
    }).catch(err => {
      // createSubscription() throws on a failed request -- was previously
      // unhandled here, a genuinely silent failure with no user feedback.
      this.loggerService.logMessage(
        'PRAYER_TEAM_SUBSCRIBE', this.prayerTeamSubscription.email, 'Failed to join the prayer team.', { err: String(err) }
      ).subscribe(errorCode => {
        this.toastService.notify({
          message: 'We could not complete your submission. Please try again - reference code: ' + errorCode,
          type: 'error'
        });
      });
    });
    // Confirmation email is queued server-side by subscribe_to_email_list
    // now (pre-prod #1) - no client mail write.
  }
}
