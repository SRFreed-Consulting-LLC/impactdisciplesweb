import { Component, OnInit, DestroyRef } from '@angular/core';
import { CloudFunctionsClient } from 'src/app/common/services/data/cloud-functions.client';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { CampaignPopupService, CampaignPopup, PopupCtaField } from 'src/app/common/services/data/campaign-popup.service';
import { FormSubmissionService } from 'src/app/common/services/data/form-submission.service';
import { FormSubmissionModel } from '@impact-common/shared/models/domain/form-submission.model';

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
export class CampaignPopupComponent implements OnInit {
  popup: CampaignPopup | null = null;
  html: SafeHtml | null = null;
  visible = false;
  dontShowAgain = false;

  // Form-CTA state (see PopupCta.type 'form').
  formValues: Record<PopupCtaField, string> = { email: '', firstName: '', lastName: '', phone: '' };
  submitting = false;
  submitDone = false;
  submitError = '';

  constructor(
    private popupService: CampaignPopupService,
    private formSubmissionService: FormSubmissionService,
    private sanitizer: DomSanitizer,
    private destroyRef: DestroyRef,
    private client: CloudFunctionsClient
  ) {}

  // Legacy popups (no structured cta) keep the whole-content click-through;
  // cta popups navigate via their buttons only.
  get legacyClickThrough(): boolean {
    return !!this.popup?.ctaUrl && !this.popup?.cta;
  }

  ctaFields(): PopupCtaField[] {
    return this.popup?.cta?.formFields ?? ['email'];
  }

  fieldLabel(field: PopupCtaField): string {
    return { email: 'Email', firstName: 'First name', lastName: 'Last name', phone: 'Phone' }[field];
  }

  ngOnInit(): void {
    this.popupService.streamAllByValue('isActive', true)
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    this.client.beacon(url);
  }

  onContentClick(): void {
    if (!this.legacyClickThrough || !this.popup?.ctaUrl) {
      return;
    }
    this.beacon(this.popup, 'web_click');
    window.location.href = this.popup.ctaUrl;
  }

  // Primary CTA: close-type dismisses; link-type counts the click and
  // navigates (the URL already carries ?cid&csrc=popup for attribution).
  onPrimary(): void {
    const cta = this.popup?.cta;
    if (!cta || cta.type === 'close') {
      this.close();
      return;
    }
    if (cta.type === 'link' && cta.linkUrl) {
      this.beacon(this.popup!, 'web_click');
      window.location.href = cta.linkUrl;
    }
  }

  // Form CTA submit: validates the email, then hands the values to the
  // chosen destination - the newsletter subscribe endpoint (with explicit
  // popup attribution so the campaign's subscribes credit) or an anonymous
  // form_submissions create (the exact rules-locked shape dynamic forms
  // use; labels match the admin's Create Contact heuristics).
  async onSubmit(): Promise<void> {
    const popup = this.popup;
    const cta = popup?.cta;
    if (!popup || !cta || this.submitting || this.submitDone) {
      return;
    }
    const email = this.formValues.email.trim().toLowerCase();
    if (!email.includes('@') || !email.includes('.')) {
      this.submitError = 'Please enter a valid email address.';
      return;
    }
    this.submitError = '';
    this.submitting = true;
    try {
      if (cta.formDestination === 'formSubmissions') {
        const fields = this.ctaFields();
        const submission = {
          ...new FormSubmissionModel(),
          formId: `popup-${popup.campaignId}`,
          formName: `Popup: ${popup.title || 'Campaign'}`,
          fieldSnapshot: fields.map((f) => ({ id: f, label: this.fieldLabel(f), type: f === 'email' ? 'email' : 'text' })),
          values: Object.fromEntries(fields.map((f) => [f, f === 'email' ? email : this.formValues[f].trim()])),
          submittedAt: new Date(),
          newRecordStatus: 'new'
        } as FormSubmissionModel;
        await this.formSubmissionService.add(submission);
      } else {
        await this.client.post(environment.subscribeUrl, {
          type: 'newsletter',
          email,
          firstName: this.formValues.firstName.trim(),
          lastName: this.formValues.lastName.trim(),
          // Popup attribution is built here, not taken from
          // AttributionService - the popup credits itself.
          attribution: { campaignId: popup.campaignId, source: 'popup' }
        });
      }
      this.submitDone = true;
      this.beacon(popup, 'web_click');
      // A successful submit is a terminal interaction - don't re-show.
      try {
        localStorage.setItem(`campaign-popup-dismissed-${popup.id}`, '1');
      } catch { /* storage unavailable - acceptable */ }
      setTimeout(() => { this.visible = false; }, 1800);
    } catch {
      this.submitError = 'Something went wrong - please try again.';
    } finally {
      this.submitting = false;
    }
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
