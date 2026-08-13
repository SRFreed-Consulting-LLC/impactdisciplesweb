import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem } from 'src/app/common/models/utils/cart.model';
import { DialogService } from 'src/app/shared/utils/services/dialog.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';
import { PricingService } from './pricing.service';
import { CART_CHANGED_EVENT, CartSummary } from './cart-events';

const STORAGE_KEY = 'cart';
const COUPON_STORAGE_KEY = 'cart-coupon';
const SUMMARY_STORAGE_KEY = 'cart-summary';

// The store's cart service -- replaces the original app's CartService
// (formerly src/app/shared/utils/services/cart.service.ts, now deleted).
// Also used by event-details.component.ts for paid event registration,
// which shares this same cart/checkout (see event-details.component.ts's
// own comment on that).
//
// Behavior fixes vs. the original CartService this replaced:
//  - Class-field state instead of a module-level closure object.
//  - One private persist() instead of 6 duplicated localStorage.setItem
//    call sites.
//  - DialogService.confirm() (the app's own existing replacement for
//    window.confirm, already used elsewhere) instead of a raw
//    window.confirm() call baked into a data service.
//  - addCartProduct(item, quantity) takes the quantity to add as a real
//    parameter instead of reading a shared singleton `orderQuantity`
//    counter that any unrelated increment()/decrement() call could have
//    silently left in a non-1 state.
//  - Toast copy fixed ("removed from cart", not "remove to cart").
//  - cartChanged$ lets the cart drawer react to mutations from any store
//    page without each caller manually re-fetching.
@Injectable({ providedIn: 'root' })
export class CartService {
  private cart: CartItem[] = this.load();
  private cartChanged = new BehaviorSubject<CartItem[]>(this.cart);
  readonly cartChanged$: Observable<CartItem[]> = this.cartChanged.asObservable();

  constructor(
    private toastService: ToastService,
    private dialogService: DialogService,
    private pricingService: PricingService
  ) {}

  getCartProducts(): CartItem[] {
    return this.cart;
  }

  // notify defaults to true for a genuine "Add to Cart" click (product
  // tile/detail page); the cart drawer/page's own +/- quantity controls
  // pass false -- a toast on every single +/- click is noisy, unlike a
  // one-time confirmation that an item was added.
  addCartProduct(payload: CartItem, quantity = 1, notify = true): void {
    const existing = this.cart.find(i => i.id === payload.id);

    if (!existing) {
      this.cart.push({ ...payload, orderQuantity: quantity });
      if (notify) {
        this.toastService.notify({ message: `${payload.itemName} added to cart`, type: 'success' });
      }
    } else if (typeof existing.orderQuantity !== 'undefined') {
      existing.orderQuantity += quantity;
      if (notify) {
        this.toastService.notify({ message: `${quantity} ${existing.itemName} added to cart`, type: 'success' });
      }
    }

    this.persist();
  }

  quantityDecrement(payload: CartItem): void {
    const existing = this.cart.find(i => i.id === payload.id);

    if (existing && typeof existing.orderQuantity !== 'undefined' && existing.orderQuantity > 1) {
      existing.orderQuantity -= 1;
    }

    this.persist();
  }

  removeCartProduct(payload: CartItem): void {
    this.cart = this.cart.filter(p => p.id !== payload.id);
    this.toastService.notify({ message: `${payload.itemName} removed from cart`, type: 'error' });
    this.persist();
  }

  async clearCart(): Promise<void> {
    const confirmed = await this.dialogService.confirm('Are you sure you want to delete all of your items?');
    if (confirmed) {
      this.cart = [];
      this.setCouponCode('');
      this.persist();
    }
  }

  clearCartNoConfirmation(): void {
    this.cart = [];
    this.setCouponCode('');
    this.persist();
  }

  /** Re-persists + re-emits the current cart without changing its contents
   *  -- for callers (e.g. CouponApplicationService) that mutate cart-item
   *  objects returned by getCartProducts() in place and need subscribers
   *  (drawer, /shopping-cart page) to pick up the change. */
  touch(): void {
    this.persist();
  }

  // Applied-coupon code lives alongside the cart in localStorage (not just
  // a transient component field) specifically so it survives a refresh or
  // direct navigation to /checkout -- replaces the original
  // store's fragile router `state: {data: shoppingCart}` handoff, which
  // loses the coupon code (and required a defensive history.state?.data
  // guard) on anything but an in-app navigation from the cart page.
  getCouponCode(): string {
    return localStorage.getItem(COUPON_STORAGE_KEY) || '';
  }

  setCouponCode(code: string): void {
    if (code) {
      localStorage.setItem(COUPON_STORAGE_KEY, code);
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }

  private load(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cart));

    // Also persisted + broadcast as a plain window CustomEvent (not just
    // the in-module cartChanged$ observable below) so the *shared*, eagerly-
    // loaded HomeHeaderComponent can show a live store cart badge
    // without importing anything from this lazy-loaded feature module --
    // doing that would pull store's code into the site's initial
    // bundle and undo the whole point of it being a separate lazy chunk.
    // See cart-events.ts for the shared event-name/shape contract.
    const summary: CartSummary = {
      quantity: this.cart.reduce((sum, item) => sum + (item.orderQuantity ?? 0), 0),
      total: this.pricingService.cartTotal(this.cart)
    };
    localStorage.setItem(SUMMARY_STORAGE_KEY, JSON.stringify(summary));

    // Both the window CustomEvent (HomeHeaderComponent's badge) and the
    // in-module cartChanged$ (the cart drawer) are deferred to a
    // microtask, not emitted synchronously: persist() can be called from
    // within another component's own lifecycle hook (e.g.
    // CheckoutSuccessComponent.ngAfterViewInit() clearing the cart after a
    // completed order) -- emitting synchronously there updates sibling
    // components that Angular already checked earlier in that same
    // change-detection pass, which is a textbook NG0100
    // ExpressionChangedAfterItHasBeenCheckedError. Queueing both emissions
    // lets them land in their own, later change-detection cycle.
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent<CartSummary>(CART_CHANGED_EVENT, { detail: summary }));
      this.cartChanged.next(this.cart);
    });
  }
}
