import { Component } from '@angular/core';
import impactDisciplesInfo from '../utils/data/impact-disciples.data';
import { SubscriptionModel } from 'src/app/common/models/domain/subscription.model';
import { SubscribeFormService } from 'src/app/shared/utils/services/subscribe-form.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})
export class FooterComponent {
  public impactDisciplesInfo = impactDisciplesInfo;

  subscription: SubscriptionModel = {... new SubscriptionModel(), type: 'newsletter'};

  constructor(private subscribeForm: SubscribeFormService){}

  handleFormSubmit() {
    return this.subscribeForm.submit('newsletter', this.subscription);
  }
}
