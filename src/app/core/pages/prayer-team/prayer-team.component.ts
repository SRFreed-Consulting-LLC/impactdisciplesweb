import { Component } from '@angular/core';
import { PrayerTeamSubscriptionModel } from 'src/app/common/models/domain/prayer-team-subscription.model';
import { PrayerTeamSubscriptionService } from 'src/app/common/services/data/prayer-team-subscription.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';

@Component({
    selector: 'app-prayer-team',
    templateUrl: './prayer-team.component.html',
    styleUrls: ['./prayer-team.component.scss'],
    standalone: false
})
export class PrayerTeamComponent {
  prayerTeamSubscription: PrayerTeamSubscriptionModel = {... new PrayerTeamSubscriptionModel()};

  constructor(private prayerTeamSubscriptionService: PrayerTeamSubscriptionService, private toastService: ToastService){}

  handleFormSubmit() {
    this.prayerTeamSubscriptionService.createPrayerTeamSubscription(this.prayerTeamSubscription.firstName, this.prayerTeamSubscription.lastName, this.prayerTeamSubscription.email).then(sub => {
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
