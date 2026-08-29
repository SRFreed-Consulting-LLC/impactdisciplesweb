import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { liveSections } from 'src/app/shared/utils/page-sections';

/**
 * Lunch and Learns - an ordered stack of sections read from
 * `page_content/lunch-and-learns`.
 *
 * The page loops; app-lunch-section draws each block according to its type.
 * Staff reorder, switch off and edit sections from Page Manager, and this
 * follows with no deploy.
 *
 * NO FALLBACK - see seminars.component.ts. No styleUrls either: the rules
 * moved with the markup into the section component.
 */
@Component({
    selector: 'app-lunch-and-learn',
    templateUrl: './lunch-and-learn.component.html',
    standalone: false
})
export class LunchAndLearnComponent {
  /** The ordered sections this page draws. Empty until the read lands. */
  readonly sections$: Observable<PageContentBlock[]>;

  constructor(pageContent: PageContentService) {
    this.sections$ = pageContent.forPage('lunch-and-learns').pipe(map(liveSections));
  }
}
