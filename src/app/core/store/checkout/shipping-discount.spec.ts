import { bestShippingDiscount } from './shipping-discount';

// Pins what a shopper is charged for shipping. The case that motivated
// extracting this: the checkout used to run an if/else where the spend
// threshold short-circuited the shipping sale, so the discount you got
// depended on which branch was checked first rather than which was better.

function inputs(over: Partial<Parameters<typeof bestShippingDiscount>[0]> = {}) {
  return {
    rate: 10,
    subtotal: 20,
    freeShippingThreshold: 75,
    campaignFreeShipping: false,
    shippingSalePercent: null,
    ...over
  };
}

describe('bestShippingDiscount', () => {
  it('gives nothing when no rule applies', () => {
    expect(bestShippingDiscount(inputs())).toBeNull();
  });

  it('frees shipping once the spend threshold is passed', () => {
    const best = bestShippingDiscount(inputs({ subtotal: 100 }));
    expect(best).toEqual({ amount: 10, reason: 'Over $75' });
  });

  it('frees shipping for a campaign offer', () => {
    const best = bestShippingDiscount(inputs({ campaignFreeShipping: true }));
    expect(best).toEqual({ amount: 10, reason: 'Free shipping offer' });
  });

  it('applies a legacy shipping sale percentage', () => {
    const best = bestShippingDiscount(inputs({ shippingSalePercent: 20 }));
    expect(best).toEqual({ amount: 2, reason: '20% Off' });
  });

  it('prefers the campaign over a smaller shipping sale', () => {
    // The old if/else could not compare these at all.
    const best = bestShippingDiscount(inputs({
      campaignFreeShipping: true,
      shippingSalePercent: 20
    }));
    expect(best?.amount).toBe(10);
    expect(best?.reason).toBe('Free shipping offer');
  });

  it('prefers a full shipping sale over the threshold when both free it', () => {
    // Both come to the whole rate; either reason is honest, but the result
    // must be the full discount rather than one silently masking the other.
    const best = bestShippingDiscount(inputs({
      subtotal: 100,
      shippingSalePercent: 100
    }));
    expect(best?.amount).toBe(10);
  });

  it('never discounts more than the shipping actually costs', () => {
    const best = bestShippingDiscount(inputs({ shippingSalePercent: 150 }));
    expect(best?.amount).toBe(10);
  });

  it('ignores a negative sale percentage instead of adding to the bill', () => {
    expect(bestShippingDiscount(inputs({ shippingSalePercent: -50 }))).toBeNull();
  });

  it('gives nothing when shipping is free already', () => {
    // A digital-only order has no rate, so there is nothing to discount and
    // no misleading "free shipping" line to show.
    expect(bestShippingDiscount(inputs({ rate: 0, campaignFreeShipping: true }))).toBeNull();
  });
});
