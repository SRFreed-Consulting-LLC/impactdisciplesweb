import { Directive, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartItem } from '@impact-common/shared/models/utils/cart.model';
import { CartLineItem } from './models/cart-line-item.model';
import { CartService } from './services/cart.service';
import { PricingService } from './services/pricing.service';
import { CouponApplicationService } from './services/coupon-application.service';

// The cart-lines view-model shared by the /cart page and the cart drawer
// (bucket A, web item 5, 2026-08-21). Both surfaces show the same lines,
// the same three totals and the same coupon box, and both had a
// byte-identical copy of every method below.
//
// What stays with each component is what genuinely differs: the drawer
// owns its offcanvas instance, its window listener and its
// close-and-navigate actions; the page owns checkout(). Only the shared
// view-model moved.
//
// @Directive() with no selector is Angular's supported way to give
// components a base class that uses DI - a plain class would not have its
// constructor parameters resolved.
@Directive()
export abstract class CartLinesBase {
  lineItems: CartLineItem[] = [];
  subtotal = 0;
  discount = 0;
  total = 0;

  couponCode = '';
  couponMessage = '';
  couponMessageType: 'success' | 'error' = 'success';
  lineNotes = new Map<string, string>();

  constructor(
    public cartService: CartService,
    protected pricingService: PricingService,
    protected couponApplicationService: CouponApplicationService,
    protected destroyRef: DestroyRef
  ) {}

  /**
   * Call from ngOnInit. Not an ngOnInit on the base itself: the drawer's
   * own ngOnInit does more, and an implicit super call is easy to drop.
   */
  protected watchCart(): void {
    this.cartService.cartChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(items => this.recompute(items));
  }

  protected recompute(items: CartItem[]): void {
    this.lineItems = this.pricingService.toCartLineItems(items);
    this.subtotal = this.pricingService.cartSubtotal(items);
    this.discount = this.pricingService.cartDiscount(items);
    this.total = this.pricingService.cartTotal(items);
  }

  async applyCoupon(): Promise<void> {
    const items = this.cartService.getCartProducts();
    this.couponApplicationService.clear(items);
    this.lineNotes.clear();

    const result = await this.couponApplicationService.validateAndApply(items, this.couponCode);

    result.lineResults.forEach(line => {
      if (line.skippedReason) {
        this.lineNotes.set(line.itemId, line.skippedReason);
      }
    });

    this.couponMessage = result.message;
    this.couponMessageType = result.applied ? 'success' : 'error';
    this.cartService.setCouponCode(result.applied ? this.couponCode : '');

    // validateAndApply() mutates item.discount/discountPrice IN PLACE on
    // the same cart-item objects CartService holds -- touch() re-persists
    // and re-emits so the drawer, the /cart page and the header count all
    // agree immediately. Removing it makes the two surfaces disagree until
    // the next cart change.
    this.cartService.touch();
    this.recompute(items);
  }

  increment(item: CartItem): void {
    this.cartService.addCartProduct(item, 1, false);
  }

  decrement(item: CartItem): void {
    this.cartService.quantityDecrement(item);
  }

  remove(item: CartItem): void {
    this.cartService.removeCartProduct(item);
  }
}
