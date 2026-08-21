import { Component } from '@angular/core';
import { SubscriptionModel } from 'src/app/common/models/domain/subscription.model';
import { SubscribeFormService } from 'src/app/shared/utils/services/subscribe-form.service';

@Component({
    selector: 'app-subscribe-area',
    templateUrl: './subscribe-area.component.html',
    styleUrls: ['./subscribe-area.component.scss'],
    standalone: false
})
export class SubscribeAreaComponent {
  subscription: SubscriptionModel = {... new SubscriptionModel(), type: 'newsletter'};

  constructor(private subscribeForm: SubscribeFormService){}

  handleFormSubmit() {
    return this.subscribeForm.submit('newsletter', this.subscription);
  }
}
