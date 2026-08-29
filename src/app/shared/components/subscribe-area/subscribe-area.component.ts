import { Component, Input } from '@angular/core';
import { SubscriptionModel } from 'src/app/common/models/domain/subscription.model';
import { SubscribeFormService } from 'src/app/shared/utils/services/subscribe-form.service';

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
  @Input() title = 'STAY IN THE LOOP';

  @Input() subtitle =
    'Join our mailing list and receive the latest news and updates from our team.';

  @Input() backgroundUrl =
    'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/' +
    'Web-Pages%2FShared%2Fnewsletter-banner.PNG?alt=media&token=928f4a44-6a3a-420b-8bf2-9aa127c1f48a';

  subscription: SubscriptionModel = {... new SubscriptionModel(), type: 'newsletter'};

  constructor(private subscribeForm: SubscribeFormService){}

  handleFormSubmit() {
    return this.subscribeForm.submit('newsletter', this.subscription);
  }
}
