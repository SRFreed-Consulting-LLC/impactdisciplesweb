import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CampaignPopupService, CampaignPopup } from 'src/app/common/services/data/campaign-popup.service';

// Web-campaign popup renderer (Campaign Manager v2, Phase 5) - mounted in
// the app shell, shows the first ACTIVE campaign popup whose date window
// covers now, to EVERY visitor (no targeting - a deliberate product
// decision), on every visit until they check "don't show this again"
// (per-popup localStorage key). Fires the campaign_web_event beacon:
// web_shown once per visitor per popup (also localStorage-guarded, which
// caps write volume), web_click on the click-through. The click-through
// URL already carries ?cid/&csrc=popup, so a same-site landing feeds
// AttributionService and any purchase/subscribe that follows credits the
// campaign. Replaces the never-rendered home_page_popups feature.
@Component({
    selector: 'app-campaign-popup',
    templateUrl: './campaign-popup.component.html',
    styleUrls: ['./campaign-popup.component.scss'],
    standalone: false
})
export class CampaignPopupComponent implements OnInit, OnDestroy {
  popup: CampaignPopup | null = null;
  html: SafeHtml | null = null;
  visible = false;
  dontShowAgain = false;

  private ngUnsubscribe = new Subject<void>();

  constructor(
    private popupService: CampaignPopupService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.popupService.streamAllByValue('isActive', true)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((popups) => {
        if (this.visible) {
          return; // don't swap content out from under an open popup
        }
        const now = Date.now();
        const eligible = (popups ?? []).find((p) => {
          const from = p.fromDate?.toMillis ? p.fromDate.toMillis() : 0;
          const to = p.toDate?.toMillis ? p.toDate.toMillis() : 0;
          return from <= now && (to === 0 || to >= now) && !this.isDismissed(p);
        });
        if (eligible) {
          this.open(eligible);
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private isDismissed(popup: CampaignPopup): boolean {
    try {
      return localStorage.getItem(`campaign-popup-dismissed-${popup.id}`) === '1';
    } catch {
      return false;
    }
  }

  private open(popup: CampaignPopup): void {
    this.popup = popup;
    // Admin-authored content (campaign_popups is staff-written) - same
    // trust tier as every other admin-authored html the site renders.
    this.html = this.sanitizer.bypassSecurityTrustHtml(popup.html ?? '');
    this.visible = true;
    this.beaconOncePerVisitor(popup);
  }

  private beaconOncePerVisitor(popup: CampaignPopup): void {
    try {
      const key = `campaign-popup-shown-${popup.id}`;
      if (localStorage.getItem(key) === '1') {
        return;
      }
      localStorage.setItem(key, '1');
      this.beacon(popup, 'web_shown');
    } catch {
      // storage unavailable - skip the impression rather than inflate it
    }
  }

  private beacon(popup: CampaignPopup, type: 'web_shown' | 'web_click'): void {
    const url = `${environment.campaignWebEventUrl}?cid=${encodeURIComponent(popup.campaignId)}&type=${type}`;
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url);
      } else {
        fetch(url).catch(() => undefined);
      }
    } catch {
      // best-effort only
    }
  }

  onContentClick(): void {
    if (!this.popup?.ctaUrl) {
      return;
    }
    this.beacon(this.popup, 'web_click');
    window.location.href = this.popup.ctaUrl;
  }

  close(): void {
    if (this.dontShowAgain && this.popup) {
      try {
        localStorage.setItem(`campaign-popup-dismissed-${this.popup.id}`, '1');
      } catch {
        // storage unavailable - it'll show again next visit, acceptable
      }
    }
    this.visible = false;
  }
}
