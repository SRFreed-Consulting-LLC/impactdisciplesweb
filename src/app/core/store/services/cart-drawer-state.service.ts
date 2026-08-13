import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CART_OPEN_DRAWER_EVENT } from './cart-events';

// Tiny cross-component signal so anything wanting to open the cart drawer
// (declared once, on every store page) can do so without routing an
// @Output()/@Input() chain through each page component individually. Also
// listens for the plain `window` CustomEvent the shared HomeHeaderComponent
// dispatches -- the header's cart link lives outside this lazy module and
// can't import this service directly (see cart-events.ts), so it
// signals through `window` instead; this listener is what turns that
// signal into the same open() call any in-module caller would use.
@Injectable({ providedIn: 'root' })
export class CartDrawerStateService {
  private openRequested = new Subject<void>();
  readonly openRequested$ = this.openRequested.asObservable();

  constructor() {
    window.addEventListener(CART_OPEN_DRAWER_EVENT, () => this.open());
  }

  open(): void {
    this.openRequested.next();
  }
}
