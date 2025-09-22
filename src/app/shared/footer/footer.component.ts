import { Component } from '@angular/core';
import impactDisciplesInfo from '../utils/data/impact-disciples.data';
import { NewsletterSubscriptionModel } from 'impactdisciplescommon/src/models/domain/newsletter-subscription.model';
import { Timestamp } from 'firebase/firestore';
import { NewsletterSubscriptionService } from 'impactdisciplescommon/src/services/data/newsletter-subscription.service';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  public impactDisciplesInfo = impactDisciplesInfo;

  subscription: NewsletterSubscriptionModel = {... new NewsletterSubscriptionModel()};

  constructor(private subscriptionService: NewsletterSubscriptionService){}

  handleFormSubmit() {
    this.subscription.date = Timestamp.now();

    this.subscriptionService.add(this.subscription).then(() => {
      notify({
        message: 'Subscription added Successfully!',
        position: 'top',
        width: 600,
        type: 'success'
      });
    })
  }
}
