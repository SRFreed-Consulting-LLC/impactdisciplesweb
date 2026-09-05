import { Component, OnInit } from '@angular/core';
import { Observable, catchError, map, of, startWith } from 'rxjs';
import { PageContentBlock, PageContentModel } from '@impact-common/shared/models/domain/page-content.model';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { DEFAULT_PAGE_THEME, PageTheme } from '@impact-common/shared/lists/section_kit';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { PagePreviewService } from 'src/app/common/services/data/page-preview.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { PageView, buildPageView, pairKitRows } from 'src/app/shared/utils/page-sections';
import { isAdminPreview } from 'src/app/shared/utils/admin-preview';

/**
 * THE HOME PAGE, drawn by the section kit like every other page.
 *
 * Cut over 2026-08-31, the last screen to move. It used to read
 * `home_sections`, hand each row to `<app-home-section>` and let that switch
 * over six types, each with its own component - which is why the same
 * "picture beside copy" band existed twice, once here and once in the kit.
 * It now reads ONE document, `page_content/home`, in the same vocabulary the
 * other twelve pages use.
 *
 * WHY IT IS STILL ITS OWN COMPONENT rather than the dynamic route. This page
 * lives at `/`, not at a slug, and it is the one page whose address is not
 * its name. The dynamic route deliberately REFUSES the slug 'home' so that
 * `/home` cannot become a second copy of the site's front page.
 *
 * Its slider's slides and its countdown's date used to live in other
 * collections - `home_page_images` and the summit event. The migration folded
 * both into the document, so this page reads one thing.
 */
@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    standalone: false
})
export class HomeComponent implements OnInit {
  state$: Observable<HomeState> = of({ status: 'loading' });

  /** Read once here and handed to every section - a page of sections should
   *  make one read of the site settings, not twenty. */
  webConfig: WebConfigModel | null = null;

  /** Page Manager's previewer, not a visitor. Drafts and switched-off
   *  sections draw here; see DynamicPageComponent for the same rule. */
  previewing = isAdminPreview();

  constructor(
    private pageContent: PageContentService,
    private preview: PagePreviewService,
    private webConfigService: WebConfigService
  ) {}

  async ngOnInit(): Promise<void> {
    this.state$ = this.preview
      .apply(
        this.pageContent.dao
          .streamByDocId('home', 'page_content', this.pageContent.fromFirestore)
          .pipe(map((rows) => rows[0] ?? null))
      )
      .pipe(
        map((doc) => this.toState(doc)),
        // A failed read must not take the front page down - it renders as an
        // empty frame with header and footer, the same as a slow one.
        catchError(() => of<HomeState>({ status: 'ready', view: { sections: [], typeIndex: {} }, rows: [], theme: DEFAULT_PAGE_THEME })),
        startWith<HomeState>({ status: 'loading' })
      );

    this.webConfig = (await this.webConfigService.getConfig().catch(() => undefined)) ?? null;
  }

  private toState(page: PageContentModel | null): HomeState {
    const view = buildPageView(page, this.previewing);
    return {
      status: 'ready',
      view,
      rows: pairKitRows(view.sections),
      theme: page?.theme ?? DEFAULT_PAGE_THEME
    };
  }
}

type HomeState =
  | { status: 'loading' }
  | { status: 'ready'; view: PageView; rows: PageContentBlock[][]; theme: PageTheme };
