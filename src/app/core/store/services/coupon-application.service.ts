import { Injectable } from '@angular/core';
import { CloudFunctionsClient } from 'src/app/common/services/data/cloud-functions.client';
import { CartItem } from '@impact-common/shared/models/utils/cart.model';
import { CouponModel } from '@impact-common/shared/models/utils/coupon.model';
import { couponOverridesSale, couponTagsCover } from '@impact-common/shared/lists/coupon-scope';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { environment } from 'src/environments/environment';

export interface CouponLineResult {
  itemId: string;
  applied: boolean;
  /** Set when the coupon was valid for this line but didn't reduce it
   *  further, e.g. it's already on sale -- lets the UI say so explicitly
   *  instead of silently no-opping while still telling the shopper their
   *  coupon "applied successfully" (the original store's bug). */
  skippedReason?: string;
}

export interface CouponApplicationResult {
  coupon?: CouponModel;
  /** True only when the code matched an active coupon AND it reduced at
   *  least one line's price -- a coupon that matched but discounted
   *  nothing (every eligible line already on sale) is NOT a success. */
  applied: boolean;
  netDiscount: number;
  lineResults: CouponLineResult[];
  message: string;
}

// Single implementation of "does this coupon apply to this cart, and by how
// much" -- replaces the logic that was embedded directly in the original
// ShoppingCartComponent.applyCoupon() (and the second, dead lookup in
// CheckoutComponent.getCouponCode() whose result was never read).
//
// The code is resolved through the `lookup_coupon` Cloud Function rather
// than a direct Firestore read (pre-prod checklist #5): the direct read
// required a world-readable `coupons` collection - anyone could enumerate
// every discount code - so the rules now lock it to staff and this single-
// code lookup happens server-side. Bonus over the old exact-match read:
// the lookup is case-insensitive. Server-side checkout pricing still
// re-validates the coupon regardless - this is UX-layer resolution only.
@Injectable({ providedIn: 'root' })
export class CouponApplicationService {
  constructor(private client: CloudFunctionsClient) {}


  async validateAndApply(items: CartItem[], code: string): Promise<CouponApplicationResult> {
    if (!code) {
      return { applied: false, netDiscount: 0, lineResults: [], message: 'Please enter a coupon code.' };
    }

    // Deliberately swallows failures: an unreachable lookup must read as
    // "coupon not valid" and let checkout continue, never as an error the
    // shopper has to clear. This is the one call site that must not throw,
    // which is why it catches here rather than the client hiding it.
    let coupon: CouponModel | null = null;
    try {
      const result = await this.client.post<{ coupon?: CouponModel }>(
        environment.lookupCouponUrl, { code });
      coupon = result?.coupon ?? null;
    } catch {
      coupon = null;
    }

    if (!coupon || !coupon.isActive) {
      return { applied: false, netDiscount: 0, lineResults: [], message: 'Coupon not valid for these items.' };
    }

    const percentOff = NumberUtil.clampPercent(coupon.percentOff);
    const lineResults: CouponLineResult[] = [];
    let netDiscount = 0;
    let anyEligible = false;

    items.forEach(item => {
      // Scope - specific ids, or the all-events sentinel - is the shared
      // rule the server prices with (couponTagsCover), so what the cart
      // shows and what the card is charged cannot disagree.
      // A cart line is a product document and always carries its id.
      const eligible = couponTagsCover(coupon.tags, { id: item.id!, isEvent: item.isEvent === true });

      if (!eligible) {
        return;
      }

      anyEligible = true;

      // Coupons don't stack on top of an already-active sale price on the
      // same line -- avoids silently compounding two discounts. This
      // preserves the original store's actual behavior; what changes here
      // is that it's now reported, not hidden behind a false "success".
      // The one exception is a 100% coupon: a giveaway beats the sale
      // (couponOverridesSale), so the holder gets in free mid-early-bird.
      const onSale = NumberUtil.isNumber(item.salePrice) && item.salePrice > 0;
      if (onSale && !couponOverridesSale(percentOff)) {
        item.discount = 0;
        item.discountPrice = undefined;
        lineResults.push({ itemId: item.id!, applied: false, skippedReason: 'Sale price already applied — coupon not additionally applied here.' });
        return;
      }

      // Off the price the shopper is actually charged - the sale price when
      // one is in force (only reachable for a 100% coupon), else the list
      // price. The same base PricingService.effectiveUnitPrice charges, so
      // the line total lands on exactly $0.
      const unitPrice = (onSale ? item.salePrice : item.price) ?? 0;
      const discount = parseFloat(((unitPrice * percentOff) / 100).toFixed(2));
      item.discount = discount;
      item.discountPrice = unitPrice - discount;
      netDiscount += discount * (item.orderQuantity ?? 1);
      lineResults.push({ itemId: item.id!, applied: true });
    });

    if (!anyEligible) {
      return { coupon, applied: false, netDiscount: 0, lineResults, message: 'Coupon not valid for these items.' };
    }

    if (netDiscount <= 0) {
      return {
        coupon,
        applied: false,
        netDiscount: 0,
        lineResults,
        message: 'Coupon is valid, but every eligible item is already on sale — no additional discount applied.'
      };
    }

    return {
      coupon,
      applied: true,
      netDiscount,
      lineResults,
      message: 'Coupon applied successfully.'
    };
  }

  /** Clears any discount previously applied by validateAndApply() -- call
   *  before re-applying so a cleared/invalid code doesn't leave stale
   *  discounts on cart items. */
  // discountPrice is cleared to undefined, not null: nothing reads it back
  // (PricingService prices off `discount`), it never reaches Firestore from
  // this app, and the model says number | undefined.
  clear(items: CartItem[]): void {
    items.forEach(item => {
      item.discount = 0;
      item.discountPrice = undefined;
    });
  }
}
