import { Directive, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';

// The shared class body behind the four equipping-groups pages (bucket A,
// web item 2, 2026-08-21). The hub page and the pastors/leaders/churches
// pages had byte-identical class bodies - the sweep counted three of them
// and missed the hub.
//
// Only the TS and the SCSS are shared. The four TEMPLATES stay separate on
// purpose: they carry genuinely different marketing copy per audience
// (92 / 69 / 60 tags, with pastors running five paragraphs where leaders
// is a "Coming Soon" stub), so folding them into one parameterized
// template would be a content redesign of live public pages rather than a
// refactor.
//
// 2026-08-29: they also now share the editable-content lookup. Each subclass
// declares its own `pageSlug`, because the four pages are four documents in
// `page_content` - the copy differs per audience, which is the whole reason
// the templates are separate.
//
// @Directive() with no selector is Angular's supported way to give
// components a base class that itself uses lifecycle hooks and DI - a
// plain class would not have its constructor parameters resolved.
@Directive()
export abstract class EquippingGroupsPageBase implements OnInit {
  /** The page_content document id for this page. */
  protected abstract readonly pageSlug: string;

  public webConfig: WebConfigModel = new WebConfigModel();
  isPlaying = false;

  /** Editable copy by slot key; every template use falls back to its own. */
  content$: Observable<Record<string, PageContentBlock>> = of({});

  constructor(
    public utilsService: UtilsService,
    private webConfigService: WebConfigService,
    private pageContentService: PageContentService
  ) {}

  async ngOnInit(): Promise<void> {
    // Assigned here rather than in a field initializer: pageSlug is a
    // SUBCLASS field, and subclass field initializers run after the base
    // constructor, so it is still undefined there (CLAUDE.md's own note on
    // field-initializer ordering).
    this.content$ = this.pageContentService.blocksFor(this.pageSlug);

    // `web_config` is treated as a singleton collection app-wide; this
    // exact getAll()[0] idiom appears at 14 sites. Consolidating it is its
    // own item - this only removes the fourfold copy of it.
    this.webConfig = await this.webConfigService.getAll().then(configs => configs[0]);
  }

  playVideo() {
    this.isPlaying = true;
  }
}
