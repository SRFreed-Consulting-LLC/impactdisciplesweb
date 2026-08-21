import { Component } from '@angular/core';
import { SubscriptionModel } from 'src/app/common/models/domain/subscription.model';
import { SubscribeFormService } from 'src/app/shared/utils/services/subscribe-form.service';

@Component({
    selector: 'app-prayer-team',
    templateUrl: './prayer-team.component.html',
    styleUrls: ['./prayer-team.component.scss'],
    standalone: false
})
export class PrayerTeamComponent {
  prayerTeamSubscription: SubscriptionModel = {... new SubscriptionModel(), type: 'prayer'};

  constructor(private subscribeForm: SubscribeFormService){}

  handleFormSubmit() {
    return this.subscribeForm.submit('prayer', this.prayerTeamSubscription);
  }
}
