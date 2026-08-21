import { Injectable } from '@angular/core';
import { CartItem } from '@impact-common/shared/models/utils/cart.model';
import { CouponModel } from '@impact-common/shared/models/utils/coupon.model';
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

  async validateAndApply(items: CartItem[], code: string): Promise<CouponApplicationResult> {
    if (!code) {
      return { applied: false, netDiscount: 0, lineResults: [], message: 'Please enter a coupon code.' };
    }

    const response = await fetch(environment.lookupCouponUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const coupon: CouponModel | null = response.ok ? (await response.json())?.coupon : null;

    if (!coupon || !coupon.isActive) {
      return { applied: false, netDiscount: 0, lineResults: [], message: 'Coupon not valid for these items.' };
    }

    const percentOff = NumberUtil.clampPercent(coupon.percentOff);
    const lineResults: CouponLineResult[] = [];
    let netDiscount = 0;
    let anyEligible = false;

    items.forEach(item => {
      const eligible = (coupon.tags?.length > 0 && coupon.tags.some(tag => tag.id === item.id))
        || !coupon.tags || coupon.tags.length === 0;

      if (!eligible) {
        return;
      }

      anyEligible = true;

      // Coupons don't stack on top of an already-active sale price on the
      // same line -- avoids silently compounding two discounts. This
      // preserves the original store's actual behavior; what changes here
      // is that it's now reported, not hidden behind a false "success".
      if (item.salePrice && item.salePrice > 0) {
        item.discount = 0;
        item.discountPrice = null;
        lineResults.push({ itemId: item.id, applied: false, skippedReason: 'Sale price already applied — coupon not additionally applied here.' });
        return;
      }

      const discount = parseFloat(((item.price * percentOff) / 100).toFixed(2));
      item.discount = discount;
      item.discountPrice = item.price - discount;
      netDiscount += discount * (item.orderQuantity ?? 1);
      lineResults.push({ itemId: item.id, applied: true });
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
  clear(items: CartItem[]): void {
    items.forEach(item => {
      item.discount = 0;
      item.discountPrice = null;
    });
  }
}
