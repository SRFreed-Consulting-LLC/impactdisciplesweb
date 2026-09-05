import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Observable, map, of, switchMap, catchError, startWith } from 'rxjs';
import { PageContentModel } from '@impact-common/shared/models/domain/page-content.model';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { DEFAULT_PAGE_THEME, PageTheme } from '@impact-common/shared/lists/section_kit';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { PagePreviewService } from 'src/app/common/services/data/page-preview.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { PageView, buildPageView, pairKitRows } from 'src/app/shared/utils/page-sections';
import { isAdminPreview } from 'src/app/shared/utils/admin-preview';

/** What the template is waiting on. Three states, not two: a page that has
 *  not loaded yet and a page that does not exist look identical in the data
 *  and must not look identical on screen. */
type DynamicPageState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; page: PageContentModel; view: PageView; rows: import('@impact-common/shared/models/domain/page-content.model').PageContentBlock[][]; theme: PageTheme };

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
 * THE PREVIEWER SHOWS THE PAGE BEING BUILT (2026-08-31, owner decision).
 * Under `?adminPreview` - and only there - three things change: an
 * unpublished page still renders (the publish gate is for visitors, not for
 * the person building the page); switched-off sections draw too, dimmed and
 * tagged by the template; and PagePreviewService composes into the stream,
 * so the editor's narrowed single-section view and its as-you-type working
 * copy both reach this page the way they already reach Home.
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

  /**
   * The site settings, handed down to every section.
   *
   * Read ONCE here rather than injected per section: a price tile names a
   * figure from Web Config, and a page of twenty sections should make one
   * read, not twenty. Same shape the equipping and seminars pages use.
   *
   * Null until it lands, which is fine - a section with an unresolvable
   * amount draws no price line rather than a wrong one.
   */
  webConfig: WebConfigModel | null = null;

  /**
   * Whether this window is Page Manager's previewer rather than a visitor.
   *
   * A FIELD rather than calling isAdminPreview() at each use, for one
   * reason: specs. The real check reads window.location and latches, which
   * a spec cannot vary per test - this field it can set.
   */
  previewing = isAdminPreview();

  constructor(
    private route: ActivatedRoute,
    private pageContent: PageContentService,
    private preview: PagePreviewService,
    private webConfigService: WebConfigService,
    private title: Title
  ) {}

  async ngOnInit(): Promise<void> {
    this.state$ = this.route.paramMap.pipe(
      map((params) => params.get('slug') ?? ''),
      switchMap((slug) => this.load(slug))
    );

    // `web_config` is treated as a singleton collection app-wide; this exact
    // getAll()[0] idiom appears at 14 sites and consolidating it is its own
    // item. Failing to read it must not take the page down - the only thing
    // that depends on it is whether a price line appears.
    this.webConfig = (await this.webConfigService.getConfig().catch(() => undefined)) ?? null;
  }

  /** The segment being drawn, so toState() can decline the home page - see
   *  its comment. */
  private slug = '';

  private load(slug: string): Observable<DynamicPageState> {
    this.slug = slug;
    if (!slug) {
      return of<DynamicPageState>({ status: 'missing' });
    }

    // apply() is inert on an ordinary visit and returns the stream as-is;
    // in the previewer it narrows to the section being edited and swaps in
    // the editor's unsaved working copy as staff type.
    return this.preview
      .apply(this.pageContent.dao
        .streamByDocId(slug, 'page_content', this.pageContent.fromFirestore)
        .pipe(map((rows) => rows[0] ?? null)))
      .pipe(
        map((page) => this.toState(page)),
        // A failed read is "no page" rather than an exception: an unhandled
        // error in a routed stream takes the whole site down, and a visitor
        // cannot tell a permission problem from a typo anyway.
        catchError(() => of<DynamicPageState>({ status: 'missing' })),
        startWith<DynamicPageState>({ status: 'loading' })
      );
  }

  /**
   * The home page's document is `page_content/home`, and its address is `/`.
   *
   * Without this, the dynamic route would ALSO serve it at `/home` - a second
   * copy of the front page on a second URL, which is a duplicate for search
   * engines and a confusing thing to link to. The home route owns the page;
   * this one declines it.
   */
  private toState(page: PageContentModel | null): DynamicPageState {
    if (this.slug === 'home') {
      return { status: 'missing' };
    }
    // WITHOUT A TITLE IT IS ONE OF THE ORIGINAL TWELVE, which has its own
    // route and its own component. Drawing it here as well would give it a
    // second, differently-styled home at the same URL.
    if (!page || !page.title) {
      return { status: 'missing' };
    }

    // Absent counts as published, so nothing that predates the flag is
    // hidden by it. Only an explicit false hides a page - and only from
    // VISITORS: the previewer exists to show the page being built, and a
    // draft page previewing as Not Found is what it was built to fix.
    if (page.isPublished === false && !this.previewing) {
      return { status: 'missing' };
    }

    this.title.setTitle(page.title);
    const view = buildPageView(page, this.previewing);
    return {
      status: 'ready',
      page,
      view,
      rows: pairKitRows(view.sections),
      theme: page.theme ?? DEFAULT_PAGE_THEME
    };
  }
}
