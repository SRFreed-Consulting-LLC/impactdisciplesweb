import { Component, Input } from '@angular/core';
import { PageContentBlock, PageContentItem } from '@impact-common/shared/models/domain/page-content.model';
import { PAGE_SECTION_TYPES } from '@impact-common/shared/lists/page_section_types.enum';

/**
 * Renders ONE About Us section, whichever type it is.
 *
 * The only thing that knows how a block's `type` maps onto markup. The page
 * itself just loops, so staff reordering sections in the admin reorders
 * them here with no code change.
 *
 * A type this build does not recognise renders NOTHING rather than failing.
 * The data outlives the build: a section written by a newer admin, or a
 * type retired from the enum, must not take the whole page down.
 */
@Component({
    selector: 'app-about-section',
    templateUrl: './about-section.component.html',
    styleUrls: ['./about-section.component.scss'],
    standalone: false
})
export class AboutSectionComponent {
  @Input({ required: true }) block!: PageContentBlock;

  /**
   * This block's position among blocks OF ITS OWN TYPE, not in the stack.
   *
   * The story columns alternate their picture side, and they have to keep
   * alternating with each other however many banners or videos are dragged
   * in between them - counting global position would break the pattern the
   * moment anything non-story moved into the middle.
   */
  @Input() typeIndex = 0;

  readonly types = PAGE_SECTION_TYPES;

  isPlaying = false;

  playVideo(): void {
    this.isPlaying = true;
  }

  /** Switched-off entries are left out, same rule as everywhere else. */
  get liveItems(): PageContentItem[] {
    return (this.block.items ?? []).filter((item) => item.isActive);
  }

  /**
   * Whether this story column puts its picture on the LEFT.
   *
   * Alternates by position rather than by a stored field, which is what the
   * page always did - so dragging a story column to a new place cannot
   * leave two pictures stacked on the same side, and there is no second
   * source of truth to keep in step.
   */
  get pictureLeft(): boolean {
    return this.typeIndex % 2 === 1;
  }

  /** Timeline entries alternate the same way, from their own position. */
  entryOnLeft(i: number): boolean {
    return i % 2 === 0;
  }
}
