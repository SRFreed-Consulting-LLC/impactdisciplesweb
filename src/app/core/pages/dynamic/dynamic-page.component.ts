import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Observable, map, of, switchMap, catchError, startWith } from 'rxjs';
import { PageContentModel } from '@impact-common/shared/models/domain/page-content.model';
import { DEFAULT_PAGE_THEME, PageTheme } from '@impact-common/shared/lists/section_kit';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { PageView, buildPageView } from 'src/app/shared/utils/page-sections';

/** What the template is waiting on. Three states, not two: a page that has
 *  not loaded yet and a page that does not exist look identical in the data
 *  and must not look identical on screen. */
type DynamicPageState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; page: PageContentModel; view: PageView; theme: PageTheme };

/**
 * ANY page staff created, drawn from its own document.
 *
 * The twelve original pages each have a hand-written route and their own
 * component. This one has neither: it takes whatever single URL segment no
 * other route claimed, looks it up in `page_content`, and draws it from the
 * section kit. Creating a page in the admin is therefore all it takes to make
 * a page exist - which is the entire point.
 *
 * WHY IT DOES NOT USE PageContentService.forPage(). That method ends in
 * `startWith(null)` so the twelve original pages can render their frame
 * immediately, and null there means BOTH "still loading" and "no such
 * document". Those twelve always exist, so the ambiguity costs them nothing.
 * Here it is the whole question: resolve it wrongly and every page shows a
 * 404 for a moment before its content lands. So this reads the document
 * itself, where the first emission is the real answer.
 *
 * NOT WIRED YET: Page Manager's previewer composes into forPage(), so a
 * builder page cannot be previewed with an unsaved edit swapped in. That is
 * the next seam, not an oversight.
 *
 * AN UNKNOWN SLUG MUST STILL 404. Before this route existed, an unmatched URL
 * fell through to the wildcard and got the Not Found page. This matcher is
 * greedier than that - it takes any single segment - so it has to render Not
 * Found itself, or a typo'd URL would render a blank page with no header, no
 * footer and no way back, which is the exact bug the wildcard was added for.
 */
@Component({
  selector: 'app-dynamic-page',
  templateUrl: './dynamic-page.component.html',
  standalone: false
})
export class DynamicPageComponent implements OnInit {
  state$: Observable<DynamicPageState> = of({ status: 'loading' });

  constructor(
    private route: ActivatedRoute,
    private pageContent: PageContentService,
    private title: Title
  ) {}

  ngOnInit(): void {
    this.state$ = this.route.paramMap.pipe(
      map((params) => params.get('slug') ?? ''),
      switchMap((slug) => this.load(slug))
    );
  }

  private load(slug: string): Observable<DynamicPageState> {
    if (!slug) {
      return of<DynamicPageState>({ status: 'missing' });
    }

    return this.pageContent.dao
      .streamByDocId(slug, 'page_content', this.pageContent.fromFirestore)
      .pipe(
        map((rows) => this.toState(rows[0] ?? null)),
        // A failed read is "no page" rather than an exception: an unhandled
        // error in a routed stream takes the whole site down, and a visitor
        // cannot tell a permission problem from a typo anyway.
        catchError(() => of<DynamicPageState>({ status: 'missing' })),
        startWith<DynamicPageState>({ status: 'loading' })
      );
  }

  private toState(page: PageContentModel | null): DynamicPageState {
    // WITHOUT A TITLE IT IS ONE OF THE ORIGINAL TWELVE, which has its own
    // route and its own component. Drawing it here as well would give it a
    // second, differently-styled home at the same URL.
    if (!page || !page.title) {
      return { status: 'missing' };
    }

    // Absent counts as published, so nothing that predates the flag is
    // hidden by it. Only an explicit false hides a page.
    if (page.isPublished === false) {
      return { status: 'missing' };
    }

    this.title.setTitle(page.title);
    return {
      status: 'ready',
      page,
      view: buildPageView(page),
      theme: page.theme ?? DEFAULT_PAGE_THEME
    };
  }
}
