import { Injectable } from '@angular/core';
import { CartItem, CheckoutForm } from '@impact-common/shared/models/utils/cart.model';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { CartLineItem, kindOf } from '../models/cart-line-item.model';

// The one place the store decides "what does this line actually cost."
// Replaces the three/four disagreeing calculators the original store has
// (CartService.totalPriceQuantity, ShoppingCartComponent's own subtotal/
// discount/total methods, CheckoutComponent's own subtotal/discount/total
// methods) with a single implementation every store component calls
// into instead of computing its own. Codifies today's de facto rule found
// across the original checkout/shopping-cart components: prefer salePrice
// as the base unit price, then layer a coupon's per-unit `discount` on top
// of that -- this is a messaging/consolidation fix, not a new pricing rule.
@Injectable({ providedIn: 'root' })
export class PricingService {
  effectiveUnitPrice(item: CartItem): number {
    if (NumberUtil.isNumber(item.salePrice) && item.salePrice > 0) {
      return item.salePrice;
    }
    return NumberUtil.isNumber(item.price) ? item.price : 0;
  }

  unitDiscount(item: CartItem): number {
    return NumberUtil.isNumber(item.discount) ? item.discount : 0;
  }

  lineSubtotal(item: CartItem): number {
    return this.effectiveUnitPrice(item) * (item.orderQuantity ?? 0);
  }

  lineDiscountTotal(item: CartItem): number {
    return this.unitDiscount(item) * (item.orderQuantity ?? 0);
  }

  lineTotal(item: CartItem): number {
    return this.lineSubtotal(item) - this.lineDiscountTotal(item);
  }

  cartSubtotal(items: CartItem[]): number {
    return (items ?? []).reduce((sum, item) => sum + this.lineSubtotal(item), 0);
  }

  cartDiscount(items: CartItem[]): number {
    return (items ?? []).reduce((sum, item) => sum + this.lineDiscountTotal(item), 0);
  }

  cartTotal(items: CartItem[]): number {
    return this.cartSubtotal(items) - this.cartDiscount(items);
  }

  /** Subtotal + tax + shipping - shipping discount, matching the original
   *  checkout's calculateOrderTotal(), NaN-guarded the same way. */
  orderTotal(checkoutForm: CheckoutForm): number {
    const items = checkoutForm?.cartItems ?? [];
    const subtotal = this.cartSubtotal(items);
    const discount = this.cartDiscount(items);
    const taxes = NumberUtil.isNumber(checkoutForm?.estimatedTaxes) ? checkoutForm.estimatedTaxes : 0;
    const shipping = NumberUtil.isNumber(checkoutForm?.shippingRate) ? checkoutForm.shippingRate : 0;
    const shippingDiscount = NumberUtil.isNumber(checkoutForm?.shippingDiscount) ? checkoutForm.shippingDiscount : 0;

    return subtotal - discount + taxes + shipping - shippingDiscount;
  }

  toCartLineItem(item: CartItem): CartLineItem {
    const unitDiscount = this.unitDiscount(item);
    let discountReason: CartLineItem['discountReason'];
    if (unitDiscount > 0) {
      discountReason = 'coupon';
    } else if (NumberUtil.isNumber(item.salePrice) && item.salePrice > 0) {
      discountReason = 'sale';
    }

    return {
      item,
      kind: kindOf(item),
      unitPrice: this.effectiveUnitPrice(item),
      unitDiscount,
      lineSubtotal: this.lineSubtotal(item),
      lineTotal: this.lineTotal(item),
      discountReason
    };
  }

  toCartLineItems(items: CartItem[]): CartLineItem[] {
    return (items ?? []).map(item => this.toCartLineItem(item));
  }
}
