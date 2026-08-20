import { Injectable } from '@angular/core';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { BaseModel } from 'src/app/common/models/base.model';
import { BaseService } from './base.service';

// Read-side twin of the admin repo's CampaignPopupModel (both repos'
// common/ are independent copies - changes never propagate automatically).
// campaign_popups is PUBLIC-READABLE by rule; it deliberately carries no
// audience or stats - just what the renderer needs.
// Structured Call To Action (2026-08-20) - mirror of the admin repo's
// PopupCta. 'close' = announcement (one dismissing button); 'link' =
// primary navigates to linkUrl (already ?cid-decorated) + secondary
// dismiss; 'form' = the popup collects admin-chosen fields (email always)
// and submits to the newsletter list or Form Submissions.
export type PopupCtaField = 'email' | 'firstName' | 'lastName' | 'phone';
export interface PopupCta {
  type: 'close' | 'link' | 'form';
  primaryLabel: string;
  dismissLabel?: string | null;
  linkUrl?: string | null;
  formFields?: PopupCtaField[] | null;
  formDestination?: 'newsletter' | 'formSubmissions' | null;
}

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
  // LEGACY whole-popup click-through - superseded by `cta` when present.
  ctaUrl?: string | null;
  cta?: PopupCta | null;
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
