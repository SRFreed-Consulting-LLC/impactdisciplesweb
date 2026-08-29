import { Directive, OnInit } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { liveSections } from 'src/app/shared/utils/page-sections';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';

// The shared class body behind the four equipping-groups pages (bucket A,
// web item 2, 2026-08-21). The hub page and the pastors/leaders/churches
// pages had byte-identical class bodies - the sweep counted three of them
// and missed the hub.
//
// 2026-08-29: the four TEMPLATES are now shared too, which they never were
// before. They stayed separate while the marketing copy lived in the markup,
// because that copy is genuinely different per audience. It is in
// page_content now, so what was left in the four templates was one identical
// layout written four times - and app-equipping-section replaced it.
//
// The pages still differ in every way that matters: each declares its own
// `pageSlug`, and each document holds its own sections in its own order.
//
// @Directive() with no selector is Angular's supported way to give
// components a base class that itself uses lifecycle hooks and DI - a
// plain class would not have its constructor parameters resolved.
@Directive()
export abstract class EquippingGroupsPageBase implements OnInit {
  /** The page_content document id for this page. */
  protected abstract readonly pageSlug: string;

  /**
   * Prices, handed down to the sections that name one.
   *
   * Amounts are never stored in page_content - a price with two homes
   * drifts - so a price line names a Web Config field and the section
   * resolves it.
   */
  public webConfig: WebConfigModel = new WebConfigModel();

  /** The ordered sections this page draws. Empty until the read lands. */
  sections$: Observable<PageContentBlock[]> = of([]);

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
    this.sections$ = this.pageContentService.forPage(this.pageSlug).pipe(map(liveSections));

    // `web_config` is treated as a singleton collection app-wide; this
    // exact getAll()[0] idiom appears at 14 sites. Consolidating it is its
    // own item - this only removes the fourfold copy of it.
    this.webConfig = await this.webConfigService.getAll().then(configs => configs[0]);
  }
}
