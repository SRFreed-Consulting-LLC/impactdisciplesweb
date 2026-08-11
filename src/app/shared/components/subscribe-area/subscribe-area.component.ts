import { Component } from '@angular/core';
import { SubscriptionModel } from 'src/app/common/models/domain/subscription.model';
import { SubscriptionService } from 'src/app/common/services/data/subscription.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';

@Component({
    selector: 'app-subscribe-area',
    templateUrl: './subscribe-area.component.html',
    styleUrls: ['./subscribe-area.component.scss'],
    standalone: false
})
export class SubscribeAreaComponent {
  subscription: SubscriptionModel = {... new SubscriptionModel(), type: 'newsletter'};

  constructor(private subscriptionService: SubscriptionService, private toastService: ToastService){}

  handleFormSubmit() {
    this.subscriptionService.createSubscription('newsletter', this.subscription.firstName, this.subscription.lastName, this.subscription.email).then(sub => {
      if(sub){
        this.toastService.notify({ message: 'Newletter Subscription added Successfully!', type: 'success' });

        return sub;
      } else {
        this.toastService.notify({ message: 'Newletter Subscription added Successfully!', type: 'success' });

        return null;
      }
    }).then(sub => {
      if(sub){
        this.subscriptionService.sendConfirmationEmail(this.subscription)
      }
    });
  }
}
