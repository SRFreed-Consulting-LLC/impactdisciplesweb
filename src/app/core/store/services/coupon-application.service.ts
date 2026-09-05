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
  /** The cart lines as they should now be - every previous coupon discount
   *  cleared, this coupon's applied where it reaches. NEW objects: the
   *  lines passed in are never edited. Hand these to
   *  CartService.replaceItems(). */
  items: CartItem[];
  coupon?: CouponModel;
  /** True only when the code matched an active coupon AND it reduced at
   *  least one line's price -- a coupon that matched but discounted
   *  nothing (every eligible line already on sale) is NOT a success. */
  applied: boolean;
  netDiscount: number;
  lineResults: CouponLineResult[];
  message: string;
}

// Coupon resolution for the cart/checkout UX. Pure over its input since
// 2026-09-05: it used to write discount/discountPrice onto the very objects
// CartService held (and the caller then had to remember to touch() the
// cart), so a coupon could change a price without the cart being told. It
// now returns the re-priced lines and CartService takes them through one
// door. Server-side checkout pricing re-validates the coupon regardless.
@Injectable({ providedIn: 'root' })
export class CouponApplicationService {
  constructor(private client: CloudFunctionsClient) {}

  async validateAndApply(items: CartItem[], code: string): Promise<CouponApplicationResult> {
    // Whatever the outcome, any earlier coupon's discount is gone.
    const cleared = this.clear(items);

    if (!code) {
      return { items: cleared, applied: false, netDiscount: 0, lineResults: [], message: 'Please enter a coupon code.' };
    }

    let coupon: CouponModel | null = null;
    try {
      const result = await this.client.post<{ coupon?: CouponModel }>(
        environment.lookupCouponUrl, { code });
      coupon = result?.coupon ?? null;
    } catch {
      coupon = null;
    }

    if (!coupon || !coupon.isActive) {
      return { items: cleared, applied: false, netDiscount: 0, lineResults: [], message: 'Coupon not valid for these items.' };
    }

    const active = coupon;
    const percentOff = NumberUtil.clampPercent(active.percentOff);
    const lineResults: CouponLineResult[] = [];
    let netDiscount = 0;
    let anyEligible = false;

    const priced = cleared.map((item) => {
      const eligible = couponTagsCover(active.tags, { id: item.id!, isEvent: item.isEvent === true });

      if (!eligible) {
        return item;
      }

      anyEligible = true;

      const onSale = NumberUtil.isNumber(item.salePrice) && item.salePrice > 0;
      if (onSale && !couponOverridesSale(percentOff)) {
        lineResults.push({ itemId: item.id!, applied: false, skippedReason: 'Sale price already applied — coupon not additionally applied here.' });
        return item;
      }

      const unitPrice = (onSale ? item.salePrice : item.price) ?? 0;
      const discount = parseFloat(((unitPrice * percentOff) / 100).toFixed(2));
      netDiscount += discount * (item.orderQuantity ?? 1);
      lineResults.push({ itemId: item.id!, applied: true });
      return { ...item, discount, discountPrice: unitPrice - discount };
    });

    if (!anyEligible) {
      return { items: cleared, coupon, applied: false, netDiscount: 0, lineResults, message: 'Coupon not valid for these items.' };
    }

    if (netDiscount <= 0) {
      return {
        items: priced,
        coupon,
        applied: false,
        netDiscount: 0,
        lineResults,
        message: 'Coupon is valid, but every eligible item is already on sale — no additional discount applied.'
      };
    }

    return {
      items: priced,
      coupon,
      applied: true,
      netDiscount,
      lineResults,
      message: 'Coupon applied successfully.'
    };
  }

  /** The same lines with any coupon discount removed - new objects. */
  clear(items: CartItem[]): CartItem[] {
    return items.map((item) => ({ ...item, discount: 0, discountPrice: undefined }));
  }
}
