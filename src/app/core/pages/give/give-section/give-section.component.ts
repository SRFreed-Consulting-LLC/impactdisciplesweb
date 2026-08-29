import { Component, Input } from '@angular/core';
import { PageContentBlock, PageContentItem } from '@impact-common/shared/models/domain/page-content.model';
import { PAGE_SECTION_TYPES } from '@impact-common/shared/lists/page_section_types.enum';
import { environment } from 'src/environments/environment';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';

/**
 * Renders ONE section of the Give page, whichever type it is.
 *
 * A type this build does not recognise renders NOTHING rather than failing -
 * the data outlives the build.
 */
@Component({
    selector: 'app-give-section',
    templateUrl: './give-section.component.html',
    // The page's own stylesheet, unchanged and unmoved - see
    // seminars-section.component.ts for why it has to live beside the markup.
    styleUrls: ['../give.component.scss'],
    standalone: false
})
export class GiveSectionComponent {
  @Input({ required: true }) block!: PageContentBlock;

  readonly types = PAGE_SECTION_TYPES;

  /** The postal address, from the site details - it already has one home. */
  readonly impactDisciplesInfo = impactDisciplesInfo;

  /**
   * WHERE A GIVING BUTTON GOES IS NOT EDITABLE, and that is a security
   * decision rather than an unfinished one.
   *
   * Each option names one of these three by KEY. The URLs themselves are
   * hosted payment pages in environment.ts. A free-text URL field on this
   * page would mean anyone who could edit content could redirect donations,
   * and no amount of staff gating makes that a good field to have. Staff can
   * rename an option, rewrite its copy, reorder it, switch it off and change
   * its icon; they cannot point it somewhere new.
   */
  private readonly giftUrls: Record<string, string> = {
    one: environment.oneGiftUrl,
    monthly: environment.monthlyGiftUrl,
    partners: environment.impactPartnersGiftUrl
  };

  get liveItems(): PageContentItem[] {
    return (this.block.items ?? []).filter((item) => item.isActive);
  }

  /** Null for an option naming a destination this build does not know, so
   *  the template can draw the tile without a dead button. */
  giftUrl(item: PageContentItem): string | null {
    return this.giftUrls[item.link ?? ''] ?? null;
  }

  openGift(item: PageContentItem): void {
    const url = this.giftUrl(item);
    if (url) {
      window.open(url, '_blank');
    }
  }
}
