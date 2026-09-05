import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem } from '@impact-common/shared/models/utils/cart.model';
import { DialogService } from 'src/app/shared/utils/services/dialog.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';
import { PricingService } from './pricing.service';
import { CART_CHANGED_EVENT, CartSummary } from './cart-events';

const STORAGE_KEY = 'cart';
const COUPON_STORAGE_KEY = 'cart-coupon';
const SUMMARY_STORAGE_KEY = 'cart-summary';

/**
 * Whether two cart entries are the SAME line: the same product in the same
 * size, colour and language. Until 2026-09-05 the answer was the product id
 * alone, which folded a Large and a Medium of one shirt into a single line
 * carrying whichever size was chosen first. Events carry none of the three,
 * so for them this is the id - and an event line is replaced rather than
 * merged, see addCartProduct.
 */
export function sameLine(a: CartItem, b: CartItem): boolean {
  return (
    a.id === b.id &&
    (a.size ?? '') === (b.size ?? '') &&
    (a.color ?? '') === (b.color ?? '') &&
    (a.language ?? '') === (b.language ?? '')
  );
}

// The store's cart service -- replaces the original app's CartService
// (formerly src/app/shared/utils/services/cart.service.ts, now deleted).
// Also used by event-details.component.ts for paid event registration,
// which shares this same cart/checkout (see event-details.component.ts's
// own comment on that).
//
// THE CART IS A VALUE. Every change builds a new array of new line objects;
// getCartProducts() hands out copies; nothing outside this class can reach
// the state it holds. Until 2026-09-05 the coupon service edited the very
// objects this service held and then asked it to touch() itself - which
// worked, and which also meant any caller anywhere could change a price
// without the cart knowing. replaceItems() is the one door for a re-priced
// cart now.
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
  private cartChanged = new BehaviorSubject<CartItem[]>(this.getCartProducts());
  readonly cartChanged$: Observable<CartItem[]> = this.cartChanged.asObservable();

  constructor(
    private toastService: ToastService,
    private dialogService: DialogService,
    private pricingService: PricingService
  ) {}

  /** A copy of the lines. Edit it all you like; the cart will not notice. */
  getCartProducts(): CartItem[] {
    return this.cart.map((line) => ({ ...line }));
  }

  // notify defaults to true for a genuine "Add to Cart" click (product
  // tile/detail page); the cart drawer/page's own +/- quantity controls
  // pass false -- a toast on every single +/- click is noisy, unlike a
  // one-time confirmation that an item was added.
  addCartProduct(payload: CartItem, quantity = 1, notify = true): void {
    const index = this.cart.findIndex((line) => sameLine(line, payload));

    if (index === -1) {
      this.cart = [...this.cart, { ...payload, orderQuantity: quantity }];
      if (notify) {
        this.toastService.notify({ message: `${payload.itemName} added to cart`, type: 'success' });
      }
    } else if (payload.isEvent) {
      // An event line's quantity IS its attendee count, and a second
      // registration for the same event arrives carrying the full, current
      // attendee list - so the line is replaced, not merged. Merging used to
      // add the quantities while keeping the FIRST list: five seats charged,
      // two people registered.
      this.cart = this.cart.map((line, i) => (i === index ? { ...payload, orderQuantity: quantity } : line));
      if (notify) {
        this.toastService.notify({ message: `${payload.itemName} updated in cart`, type: 'success' });
      }
    } else {
      this.cart = this.cart.map((line, i) =>
        i === index ? { ...line, orderQuantity: (line.orderQuantity ?? 0) + quantity } : line
      );
      if (notify) {
        this.toastService.notify({ message: `${quantity} ${payload.itemName} added to cart`, type: 'success' });
      }
    }

    this.persist();
  }

  quantityDecrement(payload: CartItem): void {
    this.cart = this.cart.map((line) =>
      sameLine(line, payload) && (line.orderQuantity ?? 0) > 1
        ? { ...line, orderQuantity: (line.orderQuantity ?? 0) - 1 }
        : line
    );

    this.persist();
  }

  removeCartProduct(payload: CartItem): void {
    this.cart = this.cart.filter((line) => !sameLine(line, payload));
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

  /** Swaps in a re-priced cart - the coupon path (CartLinesBase.applyCoupon
   *  hands back what CouponApplicationService returned) - and persists +
   *  re-emits so the drawer, the /cart page and the header count agree. The
   *  lines are copied on the way in; the caller's objects stay theirs. */
  replaceItems(items: CartItem[]): void {
    this.cart = items.map((line) => ({ ...line }));
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
      this.cartChanged.next(this.getCartProducts());
    });
  }
}
