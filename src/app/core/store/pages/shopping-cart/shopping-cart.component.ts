import { Component, OnInit, DestroyRef } from '@angular/core';
import { CartLinesBase } from 'src/app/core/store/cart-lines.base';
import { Router } from '@angular/router';
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
export class ShoppingCartComponent extends CartLinesBase implements OnInit {
  constructor(
    cartService: CartService,
    pricingService: PricingService,
    couponApplicationService: CouponApplicationService,
    private router: Router,
    destroyRef: DestroyRef
  ) {
    super(cartService, pricingService, couponApplicationService, destroyRef);
  }

  ngOnInit(): void {
    this.watchCart();
  }

  checkout(): void {
    this.router.navigateByUrl('/checkout');
  }
}
