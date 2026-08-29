import { Component } from '@angular/core';
import { SubscriptionModel } from 'src/app/common/models/domain/subscription.model';
import { SubscribeFormService } from 'src/app/shared/utils/services/subscribe-form.service';
import { Observable } from 'rxjs';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PageContentService } from 'src/app/common/services/data/page-content.service';

@Component({
    selector: 'app-prayer-team',
    templateUrl: './prayer-team.component.html',
    styleUrls: ['./prayer-team.component.scss'],
    standalone: false
})
export class PrayerTeamComponent {
  /** Editable copy by slot key; every template use falls back to its own. */
  readonly content$: Observable<Record<string, PageContentBlock>>;

  prayerTeamSubscription: SubscriptionModel = {... new SubscriptionModel(), type: 'prayer'};

  constructor(private subscribeForm: SubscribeFormService, private pageContent: PageContentService) {
    this.content$ = pageContent.blocksFor('prayer-team');
  }

  handleFormSubmit() {
    return this.subscribeForm.submit('prayer', this.prayerTeamSubscription);
  }
}
