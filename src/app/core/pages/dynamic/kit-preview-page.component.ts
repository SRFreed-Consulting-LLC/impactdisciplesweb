import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, map, of, startWith, switchMap } from 'rxjs';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import {
  DEFAULT_PAGE_THEME, PageTheme, toSectionBlocks
} from '@impact-common/shared/lists/section_kit';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { PageView, buildPageView, pairKitRows } from 'src/app/shared/utils/page-sections';

type PreviewState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; view: PageView; rows: PageContentBlock[][]; theme: PageTheme; problems: string[] };

/**
 * WHAT THE TWO NEW MEMBERS WOULD DO to a page - without doing it.
 *
 * /kit-preview/<slug> loads the page's real document, runs it through
 * toSectionBlocks() IN MEMORY, and draws the result. The document is
 * untouched; close the tab and nothing happened. The admin's Compare view
 * frames the live page and this side by side, and each page is approved by
 * eye before anything migrates.
 *
 * THE SHARED TRANSFORM IS THE WHOLE POINT. toSectionBlocks is the same
 * function the cutover script runs, so what this page shows is what a
 * migration would write - which is what makes approving it mean something.
 * Sections the flip cannot express are LISTED in a banner rather than
 * silently dropped: a preview that quietly renders a shorter page is how a
 * section gets lost with everyone watching.
 *
 * THIS ROUTE EXISTED BEFORE, for the twelve original pages, and retired with
 * the last of them on 2026-08-31. It is back for the same job one level up -
 * fourteen archetypes into two rather than nine components into fourteen -
 * and it retires again when the last page migrates.
 *
 * A PUBLISHED CHECK IS DELIBERATELY ABSENT. This is an approval tool for the
 * person doing the migration, not a way to read the site; an unpublished
 * page is exactly the kind that needs looking at before it is rewritten.
 */
@Component({
  selector: 'app-kit-preview-page',
  templateUrl: './kit-preview-page.component.html',
  styleUrls: ['./kit-preview-page.component.scss'],
  standalone: false
})
export class KitPreviewPageComponent implements OnInit {
  state$: Observable<PreviewState> = of({ status: 'loading' });

  webConfig: WebConfigModel | null = null;

  /**
   * True when the admin's Compare screen is framing this page (?framed=1).
   *
   * Framed, it wears the SAME site header and footer as the live page and
   * drops the ribbon - two frames that start differently make every real
   * difference harder to see, and the first thing anyone compared was the
   * chrome. Visited directly it keeps the ribbon and no site chrome, so
   * nobody mistakes a preview for the page it previews.
   */
  framed = false;

  constructor(
    private route: ActivatedRoute,
    private pageContent: PageContentService,
    private webConfigService: WebConfigService
  ) {}

  ngOnInit(): void {
    this.framed = this.route.snapshot.queryParamMap.get('framed') === '1';

    // ONE read for the whole page - a price piece NAMES a figure from Web
    // Config, and twenty sections should not make twenty reads. Failing to
    // read it must not take the preview down: the only thing that depends on
    // it is whether a price line appears.
    this.webConfigService.getAll()
      .then((configs) => (this.webConfig = configs[0] ?? null))
      .catch(() => (this.webConfig = null));

    this.state$ = this.route.paramMap.pipe(
      map((params) => params.get('slug') ?? ''),
      switchMap((slug) => this.preview(slug)),
      startWith({ status: 'loading' } as PreviewState)
    );
  }

  /**
   * READS THE DOCUMENT ITSELF rather than PageContentService.forPage().
   *
   * That method ends in `startWith(null)`, where null means BOTH "still
   * loading" and "no such document" - which here is the whole question, and
   * resolving it wrongly flashes "no such page" over every page that is
   * simply still loading.
   */
  private preview(slug: string): Observable<PreviewState> {
    if (!slug) {
      return of({ status: 'missing' } as PreviewState);
    }
    return of(null).pipe(
      switchMap(() => this.pageContent.getById(slug)),
      map((page) => {
        if (!page) {
          return { status: 'missing' } as PreviewState;
        }
        const { blocks, problems } = toSectionBlocks(
          (page.blocks ?? []) as unknown as Record<string, unknown>[]
        );
        const flipped = blocks as unknown as PageContentBlock[];
        const view = buildPageView({ blocks: flipped });
        return {
          status: 'ready',
          view,
          rows: pairKitRows(view.sections),
          theme: page.theme ?? DEFAULT_PAGE_THEME,
          problems
        } as PreviewState;
      }),
      catchError((err) => {
        console.error('Kit preview: could not read the page', err);
        return of({ status: 'missing' } as PreviewState);
      })
    );
  }
}
