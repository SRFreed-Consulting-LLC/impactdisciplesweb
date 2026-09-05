import { Injectable } from '@angular/core';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root'
})
export class WebConfigService extends BaseService<WebConfigModel>{
  // The site config is read by eight components on almost every page for
  // what is effectively static, rarely-changing data -- cache the
  // in-flight/completed fetch so repeated calls share one Firestore read
  // instead of each component re-fetching the whole collection. This
  // service is a singleton (providedIn: 'root' via BaseService), so the
  // cache lives for the app's session.
  private cachedConfig: Promise<WebConfigModel[]> | null = null;

  constructor(public override dao: FirebaseDAO<WebConfigModel>) {
    super(dao)
    this.table="config"
    this.fromFirestore = WebConfigService.fromFirestore
  }

  // fromFirestore normalised `taxImportDate` here until 2026-08-31. That
  // field is gone - nothing had read it since tax rates stopped being
  // imported - so there is nothing left to reshape on the way in, and a
  // hook that only re-wrote a dead field is worse than no hook.
  static readonly fromFirestore = (data: WebConfigModel): WebConfigModel => data;

  /**
   * THE site config document - the one every reader wants. Prefer this over
   * getAll(): there is exactly one document, and seven call sites each
   * indexing `[0]` off a list was how the 2026-09-05 review found the same
   * `configs[0] ?? null` fallback written five different ways.
   *
   * Resolves undefined (never throws for "empty") when the collection has
   * no document; rejects only when the read itself fails.
   */
  getConfig(): Promise<WebConfigModel | undefined> {
    return this.getAll().then((configs) => configs[0]);
  }

  override getAll(): Promise<WebConfigModel[]> {
    if (!this.cachedConfig) {
      // A FAILED read is not the answer. Until 2026-09-05 the rejected
      // promise was cached like a good one, so one transient error at
      // startup left the header without a logo, the footer without an
      // address and checkout without a PayPal client id until a full
      // reload - every later caller was handed the same old rejection.
      this.cachedConfig = super.getAll().catch((err) => {
        this.cachedConfig = null;
        throw err;
      });
    }

    return this.cachedConfig;
  }
}
