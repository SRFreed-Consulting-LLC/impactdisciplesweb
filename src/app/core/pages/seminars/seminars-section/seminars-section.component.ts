import { Component, Input } from '@angular/core';
import { PageContentBlock, PageContentItem } from '@impact-common/shared/models/domain/page-content.model';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { PAGE_SECTION_TYPES } from '@impact-common/shared/lists/page_section_types.enum';

/**
 * Renders ONE section of the Seminars page, whichever type it is.
 *
 * A type this build does not recognise renders NOTHING rather than failing.
 * The data outlives the build: a section written by a newer admin, or a type
 * retired from the enum, must not take the whole page down.
 */
@Component({
    selector: 'app-seminars-section',
    templateUrl: './seminars-section.component.html',
    // The page's own stylesheet, unchanged and unmoved - this markup used to
    // sit in the page template, and with emulated encapsulation a rule only
    // reaches the component that renders the element it names. The
    // `.seminars` wrapper stays in the page; Angular scopes only the LAST
    // part of a selector, so an ancestor outside this component still
    // matches.
    styleUrls: ['../seminars.component.scss'],
    standalone: false
})
export class SeminarsSectionComponent {
  @Input({ required: true }) block!: PageContentBlock;

  /** Prices, read from Web Config by the page - see PRICES in the enum. */
  @Input() webConfig: WebConfigModel | null = null;

  /**
   * Which form a FORM section shows.
   *
   * Stays in the page rather than in page_content: it is a Firestore
   * document id, and an id retyped into a text box is a blank widget nobody
   * can diagnose. The words AROUND the form are editable.
   */
  @Input() formId = '';

  readonly types = PAGE_SECTION_TYPES;

  isPlaying = false;

  playVideo(): void {
    this.isPlaying = true;
  }

  get liveItems(): PageContentItem[] {
    return (this.block.items ?? []).filter((item) => item.isActive);
  }

  /** The figure this entry names, from Web Config, or null if unresolvable -
   *  a price line reading "$0" is worse than one that is missing. */
  amount(item: PageContentItem): number | null {
    const key = item.amountKey;
    if (!key || !this.webConfig) {
      return null;
    }
    const value = (this.webConfig as unknown as Record<string, unknown>)[key];
    return typeof value === 'number' ? value : null;
  }
}
