import { Component, Input } from '@angular/core';
import { SubscriptionModel } from 'src/app/common/models/domain/subscription.model';
import { SubscribeFormService } from 'src/app/shared/utils/services/subscribe-form.service';
import { HOME_SUBSCRIBE_DEFAULT } from 'src/app/shared/utils/data/home-section-defaults';

/**
 * The mailing-list signup block.
 *
 * Only the presentation is editable. The FORM stays in code: it posts to
 * the subscribe_to_email_list Cloud Function, and its fields are the
 * function's contract rather than page content.
 *
 * Used on the home, events and newsletter pages, so the defaults have to
 * stand on their own - the other two pass nothing.
 */
@Component({
    selector: 'app-subscribe-area',
    templateUrl: './subscribe-area.component.html',
    styleUrls: ['./subscribe-area.component.scss'],
    standalone: false
})
export class SubscribeAreaComponent {
  @Input() title = HOME_SUBSCRIBE_DEFAULT.title;

  @Input() subtitle = HOME_SUBSCRIBE_DEFAULT.subtitle;

  @Input() backgroundUrl = HOME_SUBSCRIBE_DEFAULT.backgroundUrl;

  subscription: SubscriptionModel = {... new SubscriptionModel(), type: 'newsletter'};

  constructor(private subscribeForm: SubscribeFormService){}

  handleFormSubmit() {
    return this.subscribeForm.submit('newsletter', this.subscription);
  }
}
