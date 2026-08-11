import { Component } from '@angular/core';
import impactDisciplesInfo from '../utils/data/impact-disciples.data';
import { NewsletterSubscriptionModel } from 'src/app/common/models/domain/newsletter-subscription.model';
import { Timestamp } from 'firebase/firestore';
import { NewsletterSubscriptionService } from 'src/app/common/services/data/newsletter-subscription.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})
export class FooterComponent {
  public impactDisciplesInfo = impactDisciplesInfo;

  subscription: NewsletterSubscriptionModel = {... new NewsletterSubscriptionModel()};

  constructor(private subscriptionService: NewsletterSubscriptionService, private toastService: ToastService){}

  handleFormSubmit() {
    this.subscription.date = Timestamp.now();

    this.subscriptionService.add(this.subscription).then(() => {
      this.toastService.notify({ message: 'Subscription added Successfully!', type: 'success' });
    })
  }
}
