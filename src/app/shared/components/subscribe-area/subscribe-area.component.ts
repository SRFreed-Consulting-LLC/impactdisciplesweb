import { Component } from '@angular/core';
import notify from 'devextreme/ui/notify';
import { NewsletterSubscriptionModel } from 'src/app/common/models/domain/newsletter-subscription.model';
import { NewsletterSubscriptionService } from 'src/app/common/services/data/newsletter-subscription.service';

@Component({
    selector: 'app-subscribe-area',
    templateUrl: './subscribe-area.component.html',
    styleUrls: ['./subscribe-area.component.scss'],
    standalone: false
})
export class SubscribeAreaComponent {
  subscription: NewsletterSubscriptionModel = {... new NewsletterSubscriptionModel()};

  constructor(private subscriptionService: NewsletterSubscriptionService){}

  handleFormSubmit() {
    this.subscriptionService.createNewsLetterSubscription(this.subscription.firstName, this.subscription.lastName, this.subscription.email).then(sub => {
      if(sub){
        notify({
          message: 'Newletter Subscription added Successfully!',
          position: 'top',
          width: 600,
          type: 'success'
        });

        return sub;
      } else {
        notify({
          message: 'Newletter Subscription added Successfully!',
          position: 'top',
          width: 600,
          type: 'success'
        });

        return null;
      }
    }).then(sub => {
      if(sub){
        this.subscriptionService.sendConfirmationEmail(this.subscription)
      }
    });
  }
}
