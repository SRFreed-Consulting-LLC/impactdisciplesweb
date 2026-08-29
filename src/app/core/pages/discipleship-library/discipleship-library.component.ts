import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { liveSections } from 'src/app/shared/utils/page-sections';

/**
 * Marketing page for the Impact Discipleship Library reader app
 * (impactdisciples-library.web.app), linked from the home slider - now an
 * ordered stack of sections read from `page_content/discipleship-library`.
 *
 * The seven feature rows used to be a `ReaderFeature[]` in this class,
 * mirroring the reader's own route groups so the page could not drift from
 * what the app actually does. They are entries in the FEATURES section now,
 * which keeps that discipline in the copy while letting staff correct a
 * sentence without a deploy. Two things that were fields there are DERIVED
 * here, in app-library-section: the "01/02" chips are counted, and which side
 * a row's media sits on alternates by position - both were stored numbers
 * waiting to disagree with the order.
 *
 * NO FALLBACK - see seminars.component.ts. No styleUrls either: the rules
 * moved with the markup into the section component.
 */
@Component({
  selector: 'app-discipleship-library',
  templateUrl: './discipleship-library.component.html',
  standalone: false
})
export class DiscipleshipLibraryComponent {
  /** The ordered sections this page draws. Empty until the read lands. */
  readonly sections$: Observable<PageContentBlock[]>;

  /**
   * Where every call to action on this page goes.
   *
   * Stays here rather than in page_content: it is the address of a sibling
   * application, not marketing copy.
   */
  readonly readerUrl = 'https://impactdisciples-library.web.app';

  constructor(pageContent: PageContentService) {
    this.sections$ = pageContent.forPage('discipleship-library').pipe(map(liveSections));
  }
}
