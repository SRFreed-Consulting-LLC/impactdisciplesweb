import { Directive, OnInit } from '@angular/core';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
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
// @Directive() with no selector is Angular's supported way to give
// components a base class that itself uses lifecycle hooks and DI - a
// plain class would not have its constructor parameters resolved.
@Directive()
export abstract class EquippingGroupsPageBase implements OnInit {
  public webConfig: WebConfigModel = new WebConfigModel();
  isPlaying = false;

  constructor(
    public utilsService: UtilsService,
    private webConfigService: WebConfigService
  ) {}

  async ngOnInit(): Promise<void> {
    // `web_config` is treated as a singleton collection app-wide; this
    // exact getAll()[0] idiom appears at 14 sites. Consolidating it is its
    // own item - this only removes the fourfold copy of it.
    this.webConfig = await this.webConfigService.getAll().then(configs => configs[0]);
  }

  playVideo() {
    this.isPlaying = true;
  }
}
