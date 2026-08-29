import { Component, Input } from '@angular/core';
import { PageContentBlock, PageContentItem } from '@impact-common/shared/models/domain/page-content.model';
import { PAGE_SECTION_TYPES } from '@impact-common/shared/lists/page_section_types.enum';

/**
 * Renders ONE section of the Discipleship Library page, whichever type it is.
 *
 * A type this build does not recognise renders NOTHING rather than failing -
 * the data outlives the build.
 */
@Component({
    selector: 'app-library-section',
    templateUrl: './library-section.component.html',
    // The page's own stylesheet, unchanged and unmoved - see
    // seminars-section.component.ts for why it has to live beside the markup.
    styleUrls: ['../discipleship-library.component.scss'],
    standalone: false
})
export class LibrarySectionComponent {
  @Input({ required: true }) block!: PageContentBlock;

  /**
   * Where every call to action on this page goes.
   *
   * Stays in the page rather than in page_content: it is the address of a
   * sibling application, not marketing copy, and it changes when that app
   * moves rather than when someone rewrites a paragraph.
   */
  @Input() readerUrl = '';

  readonly types = PAGE_SECTION_TYPES;

  get liveItems(): PageContentItem[] {
    return (this.block.items ?? []).filter((item) => item.isActive);
  }

  /**
   * The "01", "02" chip beside each feature row.
   *
   * COUNTED, never stored. The rows are a numbered sequence, and a stored
   * number is the first thing to disagree with the order once staff drag one.
   */
  chip(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  /**
   * Whether this row puts its media on the right.
   *
   * Alternates by position, the same rule About Us uses for its story
   * columns - so reordering the rows can never leave two screenshots stacked
   * on the same side, and there is no stored flag to keep in step.
   */
  mediaRight(index: number): boolean {
    return index % 2 === 1;
  }

  /**
   * A clip rather than a still, read off the file itself.
   *
   * One row's media is a short muted loop because the motion IS the point
   * (dictation writing an answer as it is spoken). Which one that is used to
   * be a flag in the component; deriving it from the file means uploading an
   * mp4 is all it takes.
   */
  isVideo(item: PageContentItem): boolean {
    return /\.(mp4|webm|ogg)(\?|$)/i.test(item.image?.url ?? '');
  }

  /** A real description where the picture carries one, the row's headline
   *  otherwise - never an empty alt on a content image. */
  altFor(item: PageContentItem): string {
    return item.image?.name || item.heading || item.title;
  }
}
