import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { liveSections } from 'src/app/shared/utils/page-sections';

/**
 * Coaching With Impact - an ordered stack of sections read from
 * `page_content/coaching-with-impact`.
 *
 * Rebuilt 2026-08-23 from a verbatim WordPress/Divi export: the previous
 * template was a whole HTML document - `<!DOCTYPE html>`, `<head>`, an
 * xmlrpc pingback - nested inside this component, pulling 54 `<script>` and
 * 32 `<link>` tags off the WordPress site (jQuery, WooCommerce, Divi motion
 * effects, an exit-intent popup, Stripe and a Facebook tracking pixel) behind
 * 2,608 lines of markup and 5,462 lines of SCSS. None of it was reachable
 * behaviour in an SPA; all of it shipped to every visitor of this page.
 *
 * MADE FULLY EDITABLE 2026-08-29 (Shane's call). Everything that was written
 * into this class - the hero and grid images, the book covers, the intro
 * copy, both resource blurbs, the ECHS story, and every destination including
 * the two product deep links and the Kajabi consultation URL - is data now.
 * The trade was named at the time and accepted: a route that breaks in CODE
 * fails the build, and one that breaks in a TEXT BOX fails silently on the
 * live page. The admin's destination picker offers the site's own pages by
 * name so the common case never needs typing.
 *
 * The `coaching_page` singleton it used to read is retired with this - its
 * video id, testimonial order and screenshots are sections here now.
 *
 * NO FALLBACK, like every other wired page: the document is the only copy of
 * this page's text, so an unreadable read renders empty. See the seed and
 * MIGRATION.md.
 */
@Component({
    selector: 'app-coaching-with-impact',
    templateUrl: './coaching-with-impact.component.html',
    standalone: false
})
export class CoachingWithImpactComponent {
  /** The ordered sections this page draws. Empty until the read lands. */
  readonly sections$: Observable<PageContentBlock[]>;

  constructor(pageContent: PageContentService) {
    this.sections$ = pageContent.forPage('coaching-with-impact').pipe(map(liveSections));
  }
}
