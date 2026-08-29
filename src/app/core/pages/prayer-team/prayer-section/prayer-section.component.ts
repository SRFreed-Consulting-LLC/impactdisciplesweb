import { Component, Input } from '@angular/core';
import { PageContentBlock, PageContentItem } from '@impact-common/shared/models/domain/page-content.model';
import { PAGE_SECTION_TYPES } from '@impact-common/shared/lists/page_section_types.enum';
import { SubscriptionModel } from 'src/app/common/models/domain/subscription.model';
import { SubscribeFormService } from 'src/app/shared/utils/services/subscribe-form.service';

/**
 * Renders ONE section of the Prayer Team page, whichever type it is.
 *
 * The JOIN FORM lives here rather than in the page, because it belongs to
 * the section that draws it - the page is a loop and owns nothing. The
 * fields themselves stay in the markup: which details the prayer team asks
 * for is a decision about a mailing list, not a piece of page copy.
 *
 * A type this build does not recognise renders NOTHING rather than failing -
 * the data outlives the build.
 */
@Component({
    selector: 'app-prayer-section',
    templateUrl: './prayer-section.component.html',
    styleUrls: ['../prayer-team.component.scss'],
    standalone: false
})
export class PrayerSectionComponent {
  @Input({ required: true }) block!: PageContentBlock;

  readonly types = PAGE_SECTION_TYPES;

  prayerTeamSubscription: SubscriptionModel = { ...new SubscriptionModel(), type: 'prayer' };

  constructor(private subscribeForm: SubscribeFormService) {}

  /** The hero's buttons, as entries - so staff can add, reorder, relabel and
   *  re-icon them rather than being stuck with the two that were here. */
  get liveItems(): PageContentItem[] {
    return (this.block.items ?? []).filter((item) => item.isActive);
  }

  handleFormSubmit() {
    return this.subscribeForm.submit('prayer', this.prayerTeamSubscription);
  }
}
