import { Injectable, inject } from '@angular/core';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { CampaignOfferModel } from '@impact-common/shared/models/utils/campaign-offer.model';
import { BaseService } from './base.service';

// The storefront's read side of `campaign_offers` (Campaign Manager v3) - what
// a shopper actually pays. PUBLIC-readable by rule, and deliberately carries no
// audience, stats or coupon codes.
//
// Unlike CampaignPopupService, this does NOT redeclare the model: offers live
// in the shared submodule, so the admin writes and the storefront reads exactly
// one definition. That matters more here than for popups, because a shape drift
// on a popup shows a wrong-looking box while a shape drift on an offer charges
// the wrong price.
//
// Cached the same way ProductCatalogService caches active sales: a single
// in-flight promise reused for the session, because a browse-to-checkout run
// asks for offers on the store page, the product page and again at checkout.
// Reads are of ACTIVE offers only - date-window and attribution filtering are
// the shared offerApplies() function's job, never a second copy of the rules
// here.
@Injectable({
  providedIn: 'root'
})
export class CampaignOfferService extends BaseService<CampaignOfferModel> {
  private cachedActiveOffers: Promise<CampaignOfferModel[]> | null = null;

  constructor() {
    super(inject<FirebaseDAO<CampaignOfferModel>>(FirebaseDAO));
    this.table = 'campaign_offers';
  }

  /**
   * Every currently-active offer.
   *
   * Deliberately unfiltered beyond `isActive` - whether an offer applies to a
   * given product, at a given moment, for a given visitor is decided by the
   * shared offerApplies(), so the admin's preview and this page cannot
   * disagree.
   */
  getActiveOffers(): Promise<CampaignOfferModel[]> {
    if (!this.cachedActiveOffers) {
      this.cachedActiveOffers = this.getAllByValue('isActive', true);
    }
    return this.cachedActiveOffers;
  }

  /** Drops the session cache - for tests and for an explicit refresh. */
  clearCache(): void {
    this.cachedActiveOffers = null;
  }
}
