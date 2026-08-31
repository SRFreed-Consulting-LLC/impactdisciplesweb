import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, map, of, startWith, switchMap } from 'rxjs';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { DEFAULT_PAGE_THEME, PageTheme, toKitBlocks, toKitHomeBlocks } from '@impact-common/shared/lists/section_kit';
import { combineLatest } from 'rxjs';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { HomeSectionService } from 'src/app/common/services/data/home-sections.service';
import { HomePageImageService } from 'src/app/common/services/data/home-page-images.service';
import { EventService } from 'src/app/common/services/data/event.service';
import { toMillis } from '@impact-common/shared/utils/date-from-timestamp';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { PageView, buildPageView, pairKitRows } from 'src/app/shared/utils/page-sections';

type PreviewState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; view: PageView; rows: PageContentBlock[][]; theme: PageTheme; problems: string[] };

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

  /**
   * True when the admin's Compare screen is framing this page (?framed=1).
   *
   * Framed, it wears the SAME site header and footer as the live page and
   * drops the ribbon - the first thing Shane compared was the chrome, and
   * two frames that start differently make every real difference harder to
   * see. Visited directly it keeps the ribbon and no site chrome, so nobody
   * mistakes a preview for the page it previews.
   */
  framed = false;

  /** What the countdown counts to, read from the summit event - see
   *  loadHome(). Empty until it lands; the band then draws without a clock. */
  private summitDate = '';

  constructor(
    private route: ActivatedRoute,
    private pageContent: PageContentService,
    private homeSections: HomeSectionService,
    private homePageImages: HomePageImageService,
    private events: EventService,
    private webConfigService: WebConfigService
  ) {}

  async ngOnInit(): Promise<void> {
    this.framed = this.route.snapshot.queryParamMap.get('framed') === '1';

    // Before the stream below, so the first emission already has it.
    this.summitDate = await this.events.getAll()
      .then((all) => {
        const summit = (all ?? []).find((e) => e.isSummit && e.isActive);
        const ms = summit ? toMillis(summit.startDate) : 0;
        return ms ? new Date(ms).toISOString() : '';
      })
      .catch(() => '');
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
    // HOME is a different collection with a different model - `home_sections`
    // keyed by id, its slides in `home_page_images` - so it flips through its
    // own transform. Same contract as the twelve: what this draws is what a
    // migration would write.
    if (slug === 'home') {
      return this.loadHome();
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
          const view = buildPageView({ blocks: flipped.blocks as unknown as PageContentBlock[] });
          return {
            status: 'ready',
            view,
            rows: pairKitRows(view.sections),
            theme: DEFAULT_PAGE_THEME,
            problems: flipped.problems
          } as PreviewState;
        }),
        catchError(() => of<PreviewState>({ status: 'missing' })),
        startWith<PreviewState>({ status: 'loading' })
      );
  }

  /**
   * The home page, flipped through toKitHomeBlocks().
   *
   * THREE SOURCES, because that is what the home page is today: its sections,
   * its slider's slides (a collection of their own), and the summit's start
   * date, which is what the current countdown counts to. The migration will
   * fold the first two together and store the date on the section; handing
   * them in here is what lets the comparison show the real thing beforehand.
   */
  private loadHome(): Observable<PreviewState> {
    return combineLatest([
      this.homeSections.streamAll(),
      this.homePageImages.streamAll()
    ]).pipe(
      map(([sections, slides]) => {
        const live = [...(sections ?? [])]
          .filter((s) => s.isActive)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const orderedSlides = [...(slides ?? [])]
          .filter((s) => s.isActive)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((s) => ({
            // Slide -> entry. `link` carries the destination, the same field
            // every other kit entry uses, so href() resolves it identically.
            title: s.title, description: s.text, image: s.image,
            ctaTitle: s.ctaTitle, link: s.ctaUrl ?? s.ctaDestination, isActive: true
          }));

        const flipped = toKitHomeBlocks(
          live as unknown as Record<string, unknown>[],
          { slides: orderedSlides as unknown as Record<string, unknown>[], countdownTo: this.summitDate }
        );
        const view = buildPageView({ blocks: flipped.blocks as unknown as PageContentBlock[] });
        return {
          status: 'ready',
          view,
          rows: pairKitRows(view.sections),
          theme: DEFAULT_PAGE_THEME,
          problems: flipped.problems
        } as PreviewState;
      }),
      catchError(() => of<PreviewState>({ status: 'missing' })),
      startWith<PreviewState>({ status: 'loading' })
    );
  }
}
