import { Component } from '@angular/core';
import impactDisciplesInfo from '../utils/data/impact-disciples.data';
import { SubscriptionModel } from 'src/app/common/models/domain/subscription.model';
import { Timestamp } from 'firebase/firestore';
import { SubscriptionService } from 'src/app/common/services/data/subscription.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})
export class FooterComponent {
  public impactDisciplesInfo = impactDisciplesInfo;

  subscription: SubscriptionModel = {... new SubscriptionModel(), type: 'newsletter'};

  constructor(private subscriptionService: SubscriptionService, private toastService: ToastService){}

  handleFormSubmit() {
    this.subscription.date = Timestamp.now();

    this.subscriptionService.add(this.subscription).then(() => {
      this.toastService.notify({ message: 'Subscription added Successfully!', type: 'success' });
    })
  }
}
