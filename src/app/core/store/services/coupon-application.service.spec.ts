import { CouponApplicationService } from './coupon-application.service';
import { CloudFunctionsClient } from 'src/app/common/services/data/cloud-functions.client';
import { CartItem } from '@impact-common/shared/models/utils/cart.model';
import { CouponModel } from '@impact-common/shared/models/utils/coupon.model';

// The coupon percent math the cart/checkout UX shows. The only outside
// contact is the single `lookup_coupon` fetch, stubbed at window.fetch --
// no real network. (Server-side checkout pricing re-validates the coupon
// regardless; this service is UX-layer resolution only.)
function stubCouponLookup(coupon: Partial<CouponModel> | null, ok = true): jasmine.Spy {
  return spyOn(window, 'fetch').and.returnValue(
    Promise.resolve({ ok, json: () => Promise.resolve({ coupon }) } as unknown as Response)
  );
}

const item = (fields: Partial<CartItem>): CartItem => fields as CartItem;

describe('CouponApplicationService', () => {
  let service: CouponApplicationService;

  beforeEach(() => {
    // A real CloudFunctionsClient over a stub AttributionService - only
    // this construction changed when the transport was extracted; every
    // assertion below is untouched.
    service = new CouponApplicationService(
      new CloudFunctionsClient({ get: () => null } as never)
    );
  });

  it('applies the percent discount per unit and totals it across the quantity', async () => {
    stubCouponLookup({ isActive: true, percentOff: 25 });
    const items = [item({ id: 'p1', price: 10, orderQuantity: 2 })];

    const result = await service.validateAndApply(items, 'SAVE25');

    expect(result.applied).toBeTrue();
    expect(items[0].discount).toBe(2.5);
    expect(items[0].discountPrice).toBe(7.5);
    expect(result.netDiscount).toBe(5);
    expect(result.lineResults).toEqual([{ itemId: 'p1', applied: true }]);
    expect(result.message).toBe('Coupon applied successfully.');
  });

  it('rounds the per-unit discount to cents', async () => {
    stubCouponLookup({ isActive: true, percentOff: 33 });
    const items = [item({ id: 'p1', price: 9.99, orderQuantity: 1 })];

    await service.validateAndApply(items, 'SAVE33');

    expect(items[0].discount).toBe(3.3); // 3.2967 -> 3.30
  });

  it('assumes quantity 1 when a line has no orderQuantity', async () => {
    stubCouponLookup({ isActive: true, percentOff: 10 });
    const items = [item({ id: 'p1', price: 10 })];

    const result = await service.validateAndApply(items, 'SAVE10');

    expect(result.netDiscount).toBe(1);
  });

  it('does not stack on top of an active sale price, and says so per line', async () => {
    stubCouponLookup({ isActive: true, percentOff: 25 });
    const items = [item({ id: 'p1', price: 10, salePrice: 8, orderQuantity: 1 })];

    const result = await service.validateAndApply(items, 'SAVE25');

    expect(items[0].discount).toBe(0);
    expect(items[0].discountPrice).toBeNull();
    expect(result.applied).toBeFalse();
    expect(result.lineResults[0].applied).toBeFalse();
    expect(result.lineResults[0].skippedReason).toBeTruthy();
    expect(result.message).toContain('already on sale');
  });

  it('restricts a tagged coupon to the matching item ids only', async () => {
    stubCouponLookup({ isActive: true, percentOff: 50, tags: [{ id: 'p1' }] } as Partial<CouponModel>);
    const eligible = item({ id: 'p1', price: 10, orderQuantity: 1 });
    const ineligible = item({ id: 'p2', price: 20, orderQuantity: 1 });

    const result = await service.validateAndApply([eligible, ineligible], 'HALFOFF');

    expect(result.applied).toBeTrue();
    expect(eligible.discount).toBe(5);
    expect(ineligible.discount).toBeUndefined();
    expect(result.netDiscount).toBe(5);
    expect(result.lineResults).toEqual([{ itemId: 'p1', applied: true }]);
  });

  it('reports "not valid for these items" when no cart line matches the coupon tags', async () => {
    stubCouponLookup({ isActive: true, percentOff: 50, tags: [{ id: 'other' }] } as Partial<CouponModel>);
    const items = [item({ id: 'p1', price: 10, orderQuantity: 1 })];

    const result = await service.validateAndApply(items, 'HALFOFF');

    expect(result.applied).toBeFalse();
    expect(result.netDiscount).toBe(0);
    expect(result.message).toBe('Coupon not valid for these items.');
  });

  it('rejects an inactive coupon', async () => {
    stubCouponLookup({ isActive: false, percentOff: 25 });

    const result = await service.validateAndApply([item({ id: 'p1', price: 10 })], 'EXPIRED');

    expect(result.applied).toBeFalse();
    expect(result.message).toBe('Coupon not valid for these items.');
  });

  it('rejects an unknown code (lookup returned nothing)', async () => {
    stubCouponLookup(null, false);

    const result = await service.validateAndApply([item({ id: 'p1', price: 10 })], 'NOPE');

    expect(result.applied).toBeFalse();
    expect(result.netDiscount).toBe(0);
  });

  it('asks for a code without calling the lookup when none was entered', async () => {
    const fetchSpy = stubCouponLookup(null);

    const result = await service.validateAndApply([item({ id: 'p1', price: 10 })], '');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.applied).toBeFalse();
    expect(result.message).toBe('Please enter a coupon code.');
  });

  it('clamps an out-of-range percentOff to 100 instead of over-discounting', async () => {
    stubCouponLookup({ isActive: true, percentOff: 250 });
    const items = [item({ id: 'p1', price: 10, orderQuantity: 1 })];

    const result = await service.validateAndApply(items, 'BADDATA');

    expect(items[0].discount).toBe(10);
    expect(items[0].discountPrice).toBe(0);
    expect(result.netDiscount).toBe(10);
  });

  it('clear() removes discounts a previous apply left on the items', async () => {
    stubCouponLookup({ isActive: true, percentOff: 25 });
    const items = [item({ id: 'p1', price: 10, orderQuantity: 1 })];
    await service.validateAndApply(items, 'SAVE25');

    service.clear(items);

    expect(items[0].discount).toBe(0);
    expect(items[0].discountPrice).toBeNull();
  });
});
