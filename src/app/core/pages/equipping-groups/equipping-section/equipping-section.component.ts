import { Component, Input } from '@angular/core';
import { PageContentBlock, PageContentItem } from '@impact-common/shared/models/domain/page-content.model';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { PAGE_SECTION_TYPES } from '@impact-common/shared/lists/page_section_types.enum';

/**
 * Renders ONE section of an equipping-groups page, whichever type it is.
 *
 * ONE component for all FOUR of them - the hub and the pastors, leaders and
 * churches pages. Their templates used to be separate because they carry
 * genuinely different copy per audience, which was the right call while the
 * copy lived in the markup. It does not any more: the copy is in
 * page_content, so what is left is one identical layout used four times.
 *
 * The four pages still differ in every way that matters - they are four
 * documents, with their own sections in their own order.
 *
 * A type this build does not recognise renders NOTHING rather than failing.
 * The data outlives the build: a section written by a newer admin, or a type
 * retired from the enum, must not take the whole page down.
 */
@Component({
    selector: 'app-equipping-section',
    templateUrl: './equipping-section.component.html',
    // The page's own stylesheet, unchanged and unmoved. This markup used to
    // sit in the four page templates, and with emulated encapsulation a rule
    // only reaches the component that renders the element it names - so the
    // section that draws `.equipping-groups__approach` has to be the one
    // holding the rule for it. The `.equipping-groups` wrapper stays in the
    // page: Angular scopes only the LAST part of a selector, so an ancestor
    // outside this component still matches.
    styleUrls: ['../equipping-groups-page.shared.scss'],
    standalone: false
})
export class EquippingSectionComponent {
  @Input({ required: true }) block!: PageContentBlock;

  /**
   * Prices, read from Web Config by the page.
   *
   * An amount is NEVER stored in page_content - a price with two homes
   * drifts. A section names the Web Config field it wants and this resolves
   * it at render time.
   */
  @Input() webConfig: WebConfigModel | null = null;

  readonly types = PAGE_SECTION_TYPES;

  isPlaying = false;

  playVideo(): void {
    this.isPlaying = true;
  }

  /** Switched-off entries are left out, same rule as everywhere else. */
  get liveItems(): PageContentItem[] {
    return (this.block.items ?? []).filter((item) => item.isActive);
  }

  /** The passages in the left-hand column, in their stored order. */
  get leftItems(): PageContentItem[] {
    return this.liveItems.filter((item) => item.column !== 'right');
  }

  get rightItems(): PageContentItem[] {
    return this.liveItems.filter((item) => item.column === 'right');
  }

  /**
   * The figure this entry names, from Web Config.
   *
   * Returns null rather than 0 when it cannot be resolved, so the template
   * can leave the row out entirely - a price line reading "$0" is worse
   * than one that is missing.
   */
  amount(item: PageContentItem): number | null {
    const key = item.amountKey;
    if (!key || !this.webConfig) {
      return null;
    }
    const value = (this.webConfig as unknown as Record<string, unknown>)[key];
    return typeof value === 'number' ? value : null;
  }
}
