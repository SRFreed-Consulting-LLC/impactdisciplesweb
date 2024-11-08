import { Component } from '@angular/core';
import { PrayerTeamSubscriptionModel } from 'impactdisciplescommon/src/models/domain/prayer-team-subscription.model';
import { PrayerTeamSubscriptionService } from 'impactdisciplescommon/src/services/data/prayer-team-subscription.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-prayer-team',
  templateUrl: './prayer-team.component.html',
  styleUrls: ['./prayer-team.component.scss']
})
export class PrayerTeamComponent {
  prayerTeamSubscription: PrayerTeamSubscriptionModel = {... new PrayerTeamSubscriptionModel()};

  constructor(private prayerTeamSubscriptionService: PrayerTeamSubscriptionService, private toastrService: ToastrService){}

  handleFormSubmit() {
    this.prayerTeamSubscriptionService.createPrayerTeamSubscription(this.prayerTeamSubscription.firstName, this.prayerTeamSubscription.lastName, this.prayerTeamSubscription.email).then(sub => {
      if(sub){
        this.toastrService.success('Prayer Team Subscription added Successfully!');

        return sub;
      } else {
        this.toastrService.info('Your email is already a member of our Prayer Team!');

        return null;
      }
    }).then(sub => {
      if(sub){
        this.prayerTeamSubscriptionService.sendConfirmationEmail(this.prayerTeamSubscription);
      }
    });
  }
}
