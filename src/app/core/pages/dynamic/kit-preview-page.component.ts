import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, map, of, startWith, switchMap } from 'rxjs';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { DEFAULT_PAGE_THEME, PageTheme, toKitBlocks } from '@impact-common/shared/lists/section_kit';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { PageView, buildPageView } from 'src/app/shared/utils/page-sections';

type PreviewState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; view: PageView; theme: PageTheme; problems: string[] };

/**
 * WHAT THE KIT WOULD DO to one of the twelve original pages - without doing
 * it.
 *
 * /kit-preview/<slug> loads the page's real document, runs it through
 * toKitBlocks() IN MEMORY, and draws the result with the kit renderer. The
 * document is untouched; close the tab and nothing happened. The admin's
 * Compare view frames the live page and this side by side, and Shane
 * approves each page with his own eyes before anything migrates.
 *
 * toKitBlocks IS THE MIGRATION's own transform, shared on purpose: what this
 * page shows is byte-for-byte what a migration would write, so an approval
 * here means something. Sections the transform cannot map are LISTED in a
 * banner rather than silently dropped - a preview that quietly renders a
 * shorter page is how a section gets lost with everyone watching.
 *
 * TEMPORARY BY DESIGN. This route retires with the last of the twelve; a
 * PUBLISHED check is deliberately absent because the twelve carry no
 * isPublished at all.
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

  constructor(
    private route: ActivatedRoute,
    private pageContent: PageContentService,
    private webConfigService: WebConfigService
  ) {}

  async ngOnInit(): Promise<void> {
    this.state$ = this.route.paramMap.pipe(
      map((params) => params.get('slug') ?? ''),
      switchMap((slug) => this.load(slug))
    );

    this.webConfig = await this.webConfigService.getAll()
      .then((configs) => configs[0] ?? null)
      .catch(() => null);
  }

  private load(slug: string): Observable<PreviewState> {
    if (!slug) {
      return of<PreviewState>({ status: 'missing' });
    }
    return this.pageContent.dao
      .streamByDocId(slug, 'page_content', this.pageContent.fromFirestore)
      .pipe(
        map((rows) => {
          const doc = rows[0];
          if (!doc?.blocks?.length) {
            return { status: 'missing' } as PreviewState;
          }
          const flipped = toKitBlocks(slug, doc.blocks as unknown as Record<string, unknown>[]);
          return {
            status: 'ready',
            view: buildPageView({ blocks: flipped.blocks as unknown as PageContentBlock[] }),
            theme: DEFAULT_PAGE_THEME,
            problems: flipped.problems
          } as PreviewState;
        }),
        catchError(() => of<PreviewState>({ status: 'missing' })),
        startWith<PreviewState>({ status: 'loading' })
      );
  }
}
