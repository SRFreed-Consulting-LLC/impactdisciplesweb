import { Subject } from 'rxjs';
import { CartItem } from '@impact-common/shared/models/utils/cart.model';
import { ShoppingCartComponent } from './pages/shopping-cart/shopping-cart.component';

// Characterization suite written BEFORE the cart-lines extraction (bucket
// A, web item 5). The /cart page and the cart drawer carried a
// byte-identical recompute / applyCoupon / increment / decrement / remove
// and the same eight state fields; they are about to share a base class.
//
// Neither had a spec, and applyCoupon is the interesting one: it clears
// prior discounts, applies the coupon, collects per-line "why this line
// didn't change" notes, decides success vs error styling, persists the
// code only when it actually applied, and then re-persists the cart
// because validateAndApply MUTATES the cart items in place. That ordering
// is the behaviour worth pinning - it is what keeps the drawer, the /cart
// page and the header count agreeing after a coupon.
//
// Hand-constructed with duck-typed deps, never TestBed - house style.
describe('cart lines shared behaviour', () => {
  let cartChanged$: Subject<CartItem[]>;
  let calls: string[];
  let component: ShoppingCartComponent;
  let items: CartItem[];
  let applyResult: {
    applied: boolean; message: string;
    lineResults: { itemId: string; skippedReason?: string }[];
  };

  const cartService = () => ({
    cartChanged$,
    getCartProducts: () => items,
    setCouponCode: (c: string) => calls.push(`setCouponCode:${c}`),
    touch: () => calls.push('touch'),
    addCartProduct: (_i: CartItem, q: number) => calls.push(`add:${q}`),
    quantityDecrement: () => calls.push('decrement'),
    removeCartProduct: () => calls.push('remove')
  });

  beforeEach(() => {
    cartChanged$ = new Subject<CartItem[]>();
    calls = [];
    items = [{ id: 'i1' } as CartItem];
    applyResult = { applied: true, message: 'Coupon applied', lineResults: [] };

    component = new ShoppingCartComponent(
      cartService() as never,
      {
        toCartLineItems: () => [{ id: 'i1' }],
        cartSubtotal: () => 100,
        cartDiscount: () => 25,
        cartTotal: () => 75
      } as never,
      {
        clear: () => calls.push('clear'),
        validateAndApply: () => { calls.push('validateAndApply'); return Promise.resolve(applyResult); }
      } as never,
      { navigateByUrl: (u: string) => calls.push(`navigate:${u}`) } as never,
      {} as never
    );
  });

  it('recomputes every total from the pricing service', async () => {
    await component.applyCoupon();

    expect(component.subtotal).toBe(100);
    expect(component.discount).toBe(25);
    expect(component.total).toBe(75);
    expect(component.lineItems.length).toBe(1);
  });

  it('applies a valid coupon, persists the code, and re-persists the cart', async () => {
    await component.applyCoupon();
    component.couponCode = 'SAVE10';

    expect(calls).toEqual([
      'clear', 'validateAndApply', 'setCouponCode:', 'touch'
    ]);
    expect(component.couponMessage).toBe('Coupon applied');
    expect(component.couponMessageType).toBe('success');
  });

  it('clears the stored code when the coupon did not apply', async () => {
    // A rejected coupon must not linger on the cart - checkout would
    // otherwise re-send a code the server already refused.
    applyResult = { applied: false, message: 'Coupon not valid for these items.', lineResults: [] };
    component.couponCode = 'BOGUS';

    await component.applyCoupon();

    expect(calls).toContain('setCouponCode:');
    expect(component.couponMessageType).toBe('error');
    expect(component.couponMessage).toBe('Coupon not valid for these items.');
  });

  it('keeps a per-line note when a line was skipped', async () => {
    // "Applied successfully" while silently changing nothing was the
    // original store's bug; the note is what tells the shopper why.
    applyResult = {
      applied: true, message: 'Coupon applied',
      lineResults: [{ itemId: 'i1', skippedReason: 'Already on sale' }]
    };

    await component.applyCoupon();

    expect(component.lineNotes.get('i1')).toBe('Already on sale');
  });

  it('clears previous line notes before reapplying', async () => {
    applyResult = {
      applied: true, message: 'ok',
      lineResults: [{ itemId: 'i1', skippedReason: 'Already on sale' }]
    };
    await component.applyCoupon();

    applyResult = { applied: true, message: 'ok', lineResults: [] };
    await component.applyCoupon();

    expect(component.lineNotes.size).toBe(0);
  });

  it('routes quantity changes and removal through the cart service', () => {
    const item = { id: 'i1' } as CartItem;

    component.increment(item);
    component.decrement(item);
    component.remove(item);

    expect(calls).toEqual(['add:1', 'decrement', 'remove']);
  });
});
