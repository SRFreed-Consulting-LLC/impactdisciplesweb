import { Component } from '@angular/core';
import { NewsletterSubscriptionModel } from 'src/app/common/models/domain/newsletter-subscription.model';
import { NewsletterSubscriptionService } from 'src/app/common/services/data/newsletter-subscription.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';

@Component({
    selector: 'app-subscribe-area',
    templateUrl: './subscribe-area.component.html',
    styleUrls: ['./subscribe-area.component.scss'],
    standalone: false
})
export class SubscribeAreaComponent {
  subscription: NewsletterSubscriptionModel = {... new NewsletterSubscriptionModel()};

  constructor(private subscriptionService: NewsletterSubscriptionService, private toastService: ToastService){}

  handleFormSubmit() {
    this.subscriptionService.createNewsLetterSubscription(this.subscription.firstName, this.subscription.lastName, this.subscription.email).then(sub => {
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
