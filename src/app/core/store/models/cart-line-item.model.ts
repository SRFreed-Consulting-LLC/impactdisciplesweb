import { CartItem } from 'src/app/common/models/utils/cart.model';

// Client-only view model. Never persisted -- CartService still stores/
// reads plain CartItem[] (localStorage['cart']) and PurchasesService still
// writes plain CheckoutForm/CartItem[] to Firestore, exactly like the
// original store did. This type exists purely so components stop
// re-deriving "what kind of item is this" and "what's its real price"
// independently (see PricingService) -- it's a computed projection over a
// CartItem, built fresh whenever the cart changes, and mapped back to a
// plain CartItem via toCartItem() at the CartService boundary.
export type CartLineItemKind = 'physical' | 'ebook' | 'digitalBook' | 'event';

export type DiscountReason = 'sale' | 'coupon' | undefined;

export interface CartLineItem {
  item: CartItem;
  kind: CartLineItemKind;
  unitPrice: number;
  unitDiscount: number;
  lineSubtotal: number;
  lineTotal: number;
  discountReason: DiscountReason;
  /** Set when a coupon was valid for this line but didn't reduce it further
   *  (already on sale) -- lets the UI say so instead of silently applying
   *  nothing while still claiming success elsewhere in the cart. */
  couponSkippedReason?: string;
}

export function kindOf(item: CartItem): CartLineItemKind {
  if (item.isEvent) return 'event';
  if (item.isDigitalBook) return 'digitalBook';
  if (item.isEBook) return 'ebook';
  return 'physical';
}

export function toCartItem(line: CartLineItem): CartItem {
  return line.item;
}
