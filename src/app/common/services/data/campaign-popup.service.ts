import { Injectable } from '@angular/core';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { BaseModel } from 'src/app/common/models/base.model';
import { BaseService } from './base.service';

// Read-side twin of the admin repo's CampaignPopupModel (both repos'
// common/ are independent copies - changes never propagate automatically).
// campaign_popups is PUBLIC-READABLE by rule; it deliberately carries no
// audience or stats - just what the renderer needs.
export class CampaignPopup extends BaseModel {
  campaignId = '';
  isActive = false;
  fromDate?: { toMillis?: () => number } | null;
  toDate?: { toMillis?: () => number } | null;
  title = '';
  html = '';
  width?: number | null;
  height?: number | null;
  bgColor?: string | null;
  ctaUrl?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignPopupService extends BaseService<CampaignPopup> {
  constructor(public override dao: FirebaseDAO<CampaignPopup>) {
    super(dao)
    this.table = "campaign_popups"
  }
}
