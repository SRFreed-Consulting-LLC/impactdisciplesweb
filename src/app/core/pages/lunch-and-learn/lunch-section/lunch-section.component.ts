import { Component, Input } from '@angular/core';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PAGE_SECTION_TYPES } from '@impact-common/shared/lists/page_section_types.enum';

/**
 * Renders ONE section of the Lunch and Learns page, whichever type it is.
 *
 * A type this build does not recognise renders NOTHING rather than failing -
 * the data outlives the build.
 */
@Component({
    selector: 'app-lunch-section',
    templateUrl: './lunch-section.component.html',
    // The page's own stylesheet, unchanged and unmoved - see
    // seminars-section.component.ts for why it has to live beside the markup.
    styleUrls: ['../lunch-and-learn.component.scss'],
    standalone: false
})
export class LunchSectionComponent {
  @Input({ required: true }) block!: PageContentBlock;

  readonly types = PAGE_SECTION_TYPES;

  isPlaying = false;

  playVideo(): void {
    this.isPlaying = true;
  }
}
