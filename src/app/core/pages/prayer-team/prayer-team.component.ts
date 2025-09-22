import { Component } from '@angular/core';
import notify from 'devextreme/ui/notify';
import { PrayerTeamSubscriptionModel } from 'impactdisciplescommon/src/models/domain/prayer-team-subscription.model';
import { PrayerTeamSubscriptionService } from 'impactdisciplescommon/src/services/data/prayer-team-subscription.service';

@Component({
  selector: 'app-prayer-team',
  templateUrl: './prayer-team.component.html',
  styleUrls: ['./prayer-team.component.scss']
})
export class PrayerTeamComponent {
  prayerTeamSubscription: PrayerTeamSubscriptionModel = {... new PrayerTeamSubscriptionModel()};

  constructor(private prayerTeamSubscriptionService: PrayerTeamSubscriptionService, ){}

  handleFormSubmit() {
    this.prayerTeamSubscriptionService.createPrayerTeamSubscription(this.prayerTeamSubscription.firstName, this.prayerTeamSubscription.lastName, this.prayerTeamSubscription.email).then(sub => {
      if(sub){
        notify({
          message: 'Prayer Team Subscription added Successfully!',
          position: 'top',
          width: 600,
          type: 'success'
        });

        return sub;
      } else {
        notify({
          message: 'Your email is already a member of our Prayer Team!',
          position: 'top',
          width: 600,
          type: 'info'
        });

        return null;
      }
    }).then(sub => {
      if(sub){
        this.prayerTeamSubscriptionService.sendConfirmationEmail(this.prayerTeamSubscription);
      }
    });
  }
}
