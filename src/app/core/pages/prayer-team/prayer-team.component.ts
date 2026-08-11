import { Component } from '@angular/core';
import { SubscriptionModel } from 'src/app/common/models/domain/subscription.model';
import { SubscriptionService } from 'src/app/common/services/data/subscription.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';

@Component({
    selector: 'app-prayer-team',
    templateUrl: './prayer-team.component.html',
    styleUrls: ['./prayer-team.component.scss'],
    standalone: false
})
export class PrayerTeamComponent {
  prayerTeamSubscription: SubscriptionModel = {... new SubscriptionModel(), type: 'prayer'};

  constructor(private prayerTeamSubscriptionService: SubscriptionService, private toastService: ToastService){}

  handleFormSubmit() {
    this.prayerTeamSubscriptionService.createSubscription('prayer', this.prayerTeamSubscription.firstName, this.prayerTeamSubscription.lastName, this.prayerTeamSubscription.email).then(sub => {
      if(sub){
        this.toastService.notify({ message: 'Prayer Team Subscription added Successfully!', type: 'success' });

        return sub;
      } else {
        this.toastService.notify({ message: 'Your email is already a member of our Prayer Team!', type: 'info' });

        return null;
      }
    }).then(sub => {
      if(sub){
        this.prayerTeamSubscriptionService.sendConfirmationEmail(this.prayerTeamSubscription);
      }
    });
  }
}
