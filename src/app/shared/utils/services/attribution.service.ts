import { Injectable } from '@angular/core';

const STORAGE_KEY = 'campaign-attribution';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, last touch wins

// What checkout/subscribe/registration requests carry to the admin repo's
// Cloud Functions, which stamp it on the purchase/customer/registration
// doc and credit the campaign's funnel (see the admin repo's
// campaign-tracking/campaign-send functions - Campaign Manager v2).
export interface CampaignAttribution {
  campaignId: string;
  emailId?: string;
  source?: string;
}

interface StoredAttribution extends CampaignAttribution {
  at: number;
}

// Campaign attribution capture (Campaign Manager v2, Phase 4). Campaign
// emails' tracked links land here carrying ?cid=<campaignId> and
// &ceid=<emailId> (appended by the admin repo's link-map builder); web
// popups will add &csrc=popup in a later phase. The service reads
// window.location.search DIRECTLY in its constructor - NOT via
// ActivatedRoute - because it must run before Angular's first router
// navigation: several pages rewrite/wipe query params on landing (e.g.
// store.component.ts's ?page= cleanup), and by then the params are gone.
// AppComponent injects this service purely to force that constructor to
// run at bootstrap. Storage idiom copied from cart.service.ts
// (localStorage + a module-level key).
@Injectable({ providedIn: 'root' })
export class AttributionService {
  constructor() {
    this.captureFromUrl();
  }

  private captureFromUrl(): void {
    try {
      const params = new URLSearchParams(window.location.search);
      const cid = (params.get('cid') ?? '').trim();
      if (!cid || cid.length > 64) {
        return;
      }
      const ceid = (params.get('ceid') ?? '').trim();
      const src = (params.get('csrc') ?? '').trim();
      const stored: StoredAttribution = {
        campaignId: cid,
        ...(ceid && ceid.length <= 64 ? { emailId: ceid } : {}),
        source: src && src.length <= 32 ? src : 'email',
        at: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Storage unavailable (private mode etc.) - attribution is
      // best-effort by design; never let it break the page.
    }
  }

  /** The current attribution, or null when none/expired. Conversions
   *  (purchase, subscribe, registration) attach this to their request. */
  get(): CampaignAttribution | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const stored = JSON.parse(raw) as StoredAttribution;
      if (!stored.campaignId || Date.now() - (stored.at ?? 0) > TTL_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return {
        campaignId: stored.campaignId,
        ...(stored.emailId ? { emailId: stored.emailId } : {}),
        ...(stored.source ? { source: stored.source } : {})
      };
    } catch {
      return null;
    }
  }
}
