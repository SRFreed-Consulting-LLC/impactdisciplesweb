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

    this.prayerTeamSubscriptionService.add(this.prayerTeamSubscription).then(() => {
      this.toastrService.success('Prayer Team Subscription added Successfully!');
    })
  }
}
