import { Injectable, SecurityContext, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Modal } from 'bootstrap';

/**
 * Native replacement for devextreme/ui/dialog's confirm()/alert(). Matches
 * their call shape - confirm(message, title).then(result => ...) and
 * alert(message, title).then(() => ...) - so call sites migrate with a
 * minimal diff. Backed by a Bootstrap modal (bootstrap is already a
 * dependency of this app) instead of DevExtreme's dx-popup.
 *
 * Messages may contain simple inline HTML (e.g. "<i>...</i>") - every
 * existing call site in this app passes markup like that, matching what
 * devextreme/ui/dialog itself rendered - so this renders as HTML, but only
 * after passing through Angular's HTML sanitizer (some messages interpolate
 * Firestore-stored text such as course titles, so raw innerHTML would be a
 * stored-XSS sink). The sanitizer keeps simple inline markup like <i>/<b>
 * intact while stripping scripts/event handlers.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly sanitizer = inject(DomSanitizer);

  confirm(message: string, title = 'Confirm'): Promise<boolean> {
    return this.open(message, title, [
      { text: 'Cancel', value: false, className: 'impact-btn-blue-border impact-dialog__btn--cancel' },
      { text: 'OK', value: true, className: 'impact-btn-blue impact-dialog__btn--confirm' }
    ]).then((result) => !!result);
  }

  alert(message: string, title = 'Alert'): Promise<void> {
    return this.open(message, title, [
      { text: 'OK', value: undefined, className: 'impact-btn-blue impact-dialog__btn--confirm' }
    ]).then(() => undefined);
  }

  private open(message: string, title: string, buttons: { text: string; value: boolean | undefined; className: string }[]): Promise<boolean | undefined> {
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal fade';
      backdrop.tabIndex = -1;
      backdrop.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content impact-dialog">
            <div class="modal-header">
              <h5 class="modal-title"></h5>
            </div>
            <div class="modal-body impact-dialog__message"></div>
            <div class="modal-footer"></div>
          </div>
        </div>`;

      // Title is always a short plain-text string - set as text, never HTML.
      backdrop.querySelector('.modal-title')!.textContent = title;

      // HTML (not textContent) because call sites pass simple inline markup
      // (e.g. "<i>...</i>"), same as what was passed straight through to
      // devextreme/ui/dialog - but sanitized first, since some messages
      // interpolate Firestore-stored text (e.g. course titles).
      backdrop.querySelector('.impact-dialog__message')!.innerHTML =
        this.sanitizer.sanitize(SecurityContext.HTML, message) ?? '';

      const footer = backdrop.querySelector('.modal-footer')!;
      let settled = false;
      const settle = (value: boolean | undefined) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      buttons.forEach((btn) => {
        const buttonEl = document.createElement('button');
        buttonEl.type = 'button';
        buttonEl.className = `impact-btn ${btn.className}`;
        buttonEl.textContent = btn.text;
        buttonEl.addEventListener('click', () => {
          settle(btn.value);
          modal.hide();
        });
        footer.appendChild(buttonEl);
      });

      document.body.appendChild(backdrop);
      const modal = new Modal(backdrop);
      // Dismissing without a button click (backdrop/Esc) resolves the same
      // as Cancel for confirm(), or completes alert()'s single OK outcome.
      backdrop.addEventListener('hidden.bs.modal', () => {
        settle(undefined);
        backdrop.remove();
      });
      modal.show();
    });
  }
}
