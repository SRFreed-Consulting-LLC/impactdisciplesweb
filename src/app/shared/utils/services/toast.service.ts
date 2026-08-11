import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  /** Kept for call-site compatibility with devextreme/ui/notify's options
   *  shape (every call site in this app already passes width/position) --
   *  not actually used, since this toast is always top-center, fixed width. */
  width?: number;
  position?: string;
}

/**
 * Native replacement for devextreme/ui/notify's notify({message, type}).
 * Matches its call shape so call sites migrate with a minimal diff:
 * notify({message, type}) -> this.toastService.notify({message, type}).
 * Styled with this app's own theme (.impact-toast, see styles.scss) instead
 * of DevExtreme's dx-toast overlay.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private container: HTMLElement | null = null;

  notify(options: ToastOptions): void {
    const { message, type = 'info' } = options;

    const container = this.getContainer();

    const toast = document.createElement('div');
    toast.className = `impact-toast impact-toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.textContent = message;

    container.appendChild(toast);

    // Match devextreme/ui/notify's default ~2s display before auto-hide.
    const dismiss = () => {
      toast.classList.add('impact-toast--leaving');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };
    const timer = window.setTimeout(dismiss, 3000);
    toast.addEventListener('click', () => {
      window.clearTimeout(timer);
      dismiss();
    });
  }

  private getContainer(): HTMLElement {
    if (!this.container || !document.body.contains(this.container)) {
      this.container = document.createElement('div');
      this.container.className = 'impact-toast-container';
      document.body.appendChild(this.container);
    }
    return this.container;
  }
}
