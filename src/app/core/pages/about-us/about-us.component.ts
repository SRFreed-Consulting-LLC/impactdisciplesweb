import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PageContentService } from 'src/app/common/services/data/page-content.service';

/** What the template needs: the live sections, and each one's position
 *  among blocks of its own type. */
export interface AboutView {
  sections: PageContentBlock[];
  typeIndex: Record<string, number>;
}

/**
 * About Us - an ordered stack of sections read from `page_content/about-us`.
 *
 * The page holds no copy and no layout decisions of its own: it loops, and
 * app-about-section draws each block according to its type. Staff reorder
 * sections, switch one off, and edit any of them from Page Manager > About
 * Us, and this follows with no deploy.
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
  readonly view$: Observable<AboutView>;

  constructor(pageContent: PageContentService) {
    this.view$ = pageContent.forPage('about-us').pipe(map(buildView));
  }
}

/** Pure, so the alternation rule can be tested without a component. */
export function buildView(doc: { blocks?: PageContentBlock[] } | null): AboutView {
  // Switched-off sections are left out FIRST, so the index a story column
  // alternates on counts only what a visitor actually sees - hiding one
  // must not leave two pictures stacked on the same side.
  const sections = (doc?.blocks ?? []).filter((b) => b.isActive !== false);

  const seen = new Map<string, number>();
  const typeIndex: Record<string, number> = {};
  for (const block of sections) {
    const type = block.type ?? '';
    const n = seen.get(type) ?? 0;
    typeIndex[block.key] = n;
    seen.set(type, n + 1);
  }
  return { sections, typeIndex };
}
