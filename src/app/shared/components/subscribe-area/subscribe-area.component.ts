import { Component } from '@angular/core';
import { NewsletterSubscriptionModel } from 'impactdisciplescommon/src/models/domain/newsletter-subscription.model';
import { NewsletterSubscriptionService } from 'impactdisciplescommon/src/services/data/newsletter-subscription.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-subscribe-area',
  templateUrl: './subscribe-area.component.html',
  styleUrls: ['./subscribe-area.component.scss']
})
export class SubscribeAreaComponent {
  subscription: NewsletterSubscriptionModel = {... new NewsletterSubscriptionModel()};

  constructor(private subscriptionService: NewsletterSubscriptionService,
    private toastrService: ToastrService){}

  handleFormSubmit() {
    this.subscriptionService.createNewsLetterSubscription(this.subscription.firstName, this.subscription.lastName, this.subscription.email).then(() => {
      this.toastrService.success('Subscription added Successfully!');
    }).then(() => {
      this.subscriptionService.sendConfirmationEmail(this.subscription)
    });
  }
}
