import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { liveSections } from 'src/app/shared/utils/page-sections';

/**
 * Give - an ordered stack of sections read from `page_content/give`.
 *
 * Giving is entirely link-out: the buttons open hosted payment pages from
 * environment.{oneGiftUrl, monthlyGiftUrl, impactPartnersGiftUrl} in a new
 * tab. WHERE THEY GO IS NOT EDITABLE - an option names one of those three by
 * key and app-give-section resolves it. See that component for why.
 *
 * NO FALLBACK - see seminars.component.ts.
 *
 * This one page keeps its styleUrls, unlike the other dispatchers: the
 * stylesheet holds one rule for the `.give` wrapper, which is in THIS
 * template, alongside the rules for markup that moved into the section.
 */
@Component({
    selector: 'app-give',
    templateUrl: './give.component.html',
    styleUrls: ['./give.component.scss'],
    standalone: false
})
export class GiveComponent {
  /** The ordered sections this page draws. Empty until the read lands. */
  readonly sections$: Observable<PageContentBlock[]>;

  constructor(pageContent: PageContentService) {
    this.sections$ = pageContent.forPage('give').pipe(map(liveSections));
  }
}
