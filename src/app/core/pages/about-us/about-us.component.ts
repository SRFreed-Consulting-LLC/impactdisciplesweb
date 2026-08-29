import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { PageView, buildPageView } from 'src/app/shared/utils/page-sections';

/**
 * About Us - an ordered stack of sections read from `page_content/about-us`.
 *
 * The page holds no copy and no layout decisions of its own: it loops, and
 * app-about-section draws each block according to its type. Staff reorder
 * sections, switch one off, and edit any of them from Page Manager > About
 * Us, and this follows with no deploy.
 *
 * It asks for the full PageView rather than just the live sections because
 * its story columns alternate which side their picture sits on, and that
 * needs each block's position among blocks of its OWN type. buildPageView is
 * shared with every other dispatcher page for exactly that reason - the rule
 * is subtle enough that eleven copies would drift.
 *
 * NO FALLBACK. The document is the only copy of this page's text - the
 * duplicate that used to live in this template was removed when the page
 * was seeded (Shane's call, 2026-08-29). An unreadable read renders an
 * empty page, so page_content must exist in an environment before this
 * build ships there.
 *
 * Bound through the async pipe rather than a subscription, so there is
 * nothing to tear down - the sweep's A1 finding was five snapshot listeners
 * that never unsubscribed, and this stream is long-lived and shared.
 */
@Component({
    selector: 'app-about-us',
    templateUrl: './about-us.component.html',
    styleUrls: ['./about-us.component.scss'],
    standalone: false
})
export class AboutUsComponent {
  readonly view$: Observable<PageView>;

  constructor(pageContent: PageContentService) {
    this.view$ = pageContent.forPage('about-us').pipe(map(buildPageView));
  }
}
