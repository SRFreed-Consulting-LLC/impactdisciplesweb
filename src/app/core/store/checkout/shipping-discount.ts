// Which shipping discount a shopper actually gets (Campaign Manager v3).
//
// Three things can discount shipping now, and before this they could not all
// be considered together: the checkout ran an if/else where the spend
// threshold short-circuited the shipping sale entirely, so whichever was
// checked first won regardless of which was worth more.
//
// Extracted as a pure function because it is a pricing DECISION living inside
// a 480-line component that also owns PayPal, addresses and form state - the
// one part of that file worth pinning with tests.

export interface ShippingDiscount {
  amount: number;
  reason: string;
}

export interface ShippingDiscountInputs {
  /** The quoted shipping cost for the whole order. */
  rate: number;
  /** Cart subtotal, for the free-shipping spend threshold. */
  subtotal: number;
  /** Web Config's free-shipping threshold; spend above it ships free. */
  freeShippingThreshold: number;
  /** A campaign offer covering something in the cart grants free shipping. */
  campaignFreeShipping: boolean;
  /** Legacy `sales` shipping percentage, or null when none is running. */
  shippingSalePercent: number | null;
}

/**
 * The best discount for the SHOPPER, or null when nothing applies.
 *
 * Best-of, not first-match: a campaign that frees shipping outright should
 * beat a 20%-off shipping sale even when the sale is found first, and the
 * spend threshold should not hide a better campaign offer.
 */
export function bestShippingDiscount(inputs: ShippingDiscountInputs): ShippingDiscount | null {
  const rate = Number.isFinite(inputs.rate) ? Math.max(0, inputs.rate) : 0;
  if (rate === 0) {
    return null;
  }

  const candidates: ShippingDiscount[] = [];

  if (inputs.subtotal > inputs.freeShippingThreshold) {
    candidates.push({ amount: rate, reason: 'Over $' + inputs.freeShippingThreshold });
  }

  if (inputs.campaignFreeShipping) {
    candidates.push({ amount: rate, reason: 'Free shipping offer' });
  }

  if (inputs.shippingSalePercent !== null) {
    const percent = Math.min(100, Math.max(0, inputs.shippingSalePercent));
    candidates.push({ amount: (percent / 100) * rate, reason: percent + '% Off' });
  }

  const best = candidates.sort((a, b) => b.amount - a.amount)[0];
  return best && best.amount > 0 ? best : null;
}
