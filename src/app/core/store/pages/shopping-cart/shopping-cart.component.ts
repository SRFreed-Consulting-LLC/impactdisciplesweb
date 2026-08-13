import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CartItem } from 'src/app/common/models/utils/cart.model';
import { CartLineItem } from '../../models/cart-line-item.model';
import { CartService } from '../../services/cart.service';
import { PricingService } from '../../services/pricing.service';
import { CouponApplicationService } from '../../services/coupon-application.service';

// Copy of the original shopping-cart.component.ts. Totals now come from
// PricingService instead of this component's own getCartSubtotal/
// getCartDiscount/getCartTotal (a second, disagreeing implementation in the
// original vs. CartService.totalPriceQuantity() and CheckoutComponent's own
// third implementation). Coupon logic goes through CouponApplicationService
// instead of being embedded here, which also fixes the original's silent
// "coupon applied successfully" toast when every eligible item was already
// on sale (see coupon-application.service.ts).
//
// Also drops the original's fragile cart->checkout handoff via
// router.navigate(..., {state: {data: shoppingCart}}) (lost on refresh) --
// checkout reads straight from CartService itself, so there's
// nothing to pass at all.
@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss'],
  standalone: false
})
export class ShoppingCartComponent implements OnInit, OnDestroy {
  lineItems: CartLineItem[] = [];
  subtotal = 0;
  discount = 0;
  total = 0;

  couponCode = '';
  couponMessage = '';
  couponMessageType: 'success' | 'error' = 'success';
  lineNotes = new Map<string, string>();

  private ngUnsubscribe = new Subject<void>();

  constructor(
    public cartService: CartService,
    private pricingService: PricingService,
    private couponApplicationService: CouponApplicationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.cartChanged$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(items => this.recompute(items));
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private recompute(items: CartItem[]): void {
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

  checkout(): void {
    this.router.navigateByUrl('/checkout');
  }
}
