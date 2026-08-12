export class NumberUtil{
  public static isNumber(value): boolean {
    return typeof value === 'number' && !Number.isNaN(value);
   }

  // Defense in depth for Coupon/Sale.percentOff: the admin dialogs now
  // validate 0-100 on save (2026-08-12 fullsweep fix), but records created
  // before that fix - or edited directly in the Firestore console - can
  // still hold an out-of-range or non-numeric value. Every discount/sale-
  // price calculation reading percentOff should clamp through this rather
  // than trust the stored value directly, so a bad record degrades to "no
  // discount" instead of a negative price/charge.
  public static clampPercent(value): number {
    if (!NumberUtil.isNumber(value)) {
      return 0;
    }
    return Math.min(100, Math.max(0, value));
  }
}
