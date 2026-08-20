import { CartService } from './cart.service';
import { PricingService } from './pricing.service';
import { CartItem } from 'src/app/common/models/utils/cart.model';
import { DialogService } from 'src/app/shared/utils/services/dialog.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';

// Must match the service's module-level storage keys.
const STORAGE_KEY = 'cart';
const COUPON_STORAGE_KEY = 'cart-coupon';
const SUMMARY_STORAGE_KEY = 'cart-summary';

interface TestHarness {
  service: CartService;
  notify: jasmine.Spy;
  confirm: jasmine.Spy;
}

// Toast and dialog are duck-typed down to the one method each that
// CartService calls; PricingService is the real thing -- it's pure math
// with no dependencies, and using it keeps the persisted summary's total
// honest instead of restating a stub.
function buildService(confirmResult = true): TestHarness {
  const notify = jasmine.createSpy('notify');
  const confirm = jasmine.createSpy('confirm').and.returnValue(Promise.resolve(confirmResult));

  const service = new CartService(
    { notify } as unknown as ToastService,
    { confirm } as unknown as DialogService,
    new PricingService()
  );

  return { service, notify, confirm };
}

const item = (fields: Partial<CartItem>): CartItem => fields as CartItem;

function storedCart(): CartItem[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
}

describe('CartService', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COUPON_STORAGE_KEY);
    localStorage.removeItem(SUMMARY_STORAGE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COUPON_STORAGE_KEY);
    localStorage.removeItem(SUMMARY_STORAGE_KEY);
  });

  describe('addCartProduct', () => {
    it('adds a new item with the requested quantity and persists it', () => {
      const { service, notify } = buildService();

      service.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }), 2);

      expect(service.getCartProducts()).toEqual([jasmine.objectContaining({ id: 'p1', orderQuantity: 2 })]);
      expect(storedCart()).toEqual([jasmine.objectContaining({ id: 'p1', orderQuantity: 2 })]);
      expect(notify).toHaveBeenCalledOnceWith(jasmine.objectContaining({ type: 'success' }));
    });

    it('defaults the quantity to 1', () => {
      const { service } = buildService();

      service.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }));

      expect(service.getCartProducts()[0].orderQuantity).toBe(1);
    });

    it('increments the existing line instead of duplicating it', () => {
      const { service } = buildService();
      service.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }), 1);

      service.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }), 3);

      expect(service.getCartProducts().length).toBe(1);
      expect(service.getCartProducts()[0].orderQuantity).toBe(4);
    });

    it('suppresses the toast when notify is false (drawer +/- controls)', () => {
      const { service, notify } = buildService();

      service.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }), 1, false);

      expect(notify).not.toHaveBeenCalled();
    });
  });

  describe('quantityDecrement', () => {
    it('decrements the line quantity', () => {
      const { service } = buildService();
      service.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }), 3);

      service.quantityDecrement(item({ id: 'p1' }));

      expect(service.getCartProducts()[0].orderQuantity).toBe(2);
    });

    it('never goes below 1 -- removal is an explicit, separate action', () => {
      const { service } = buildService();
      service.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }), 1);

      service.quantityDecrement(item({ id: 'p1' }));

      expect(service.getCartProducts()[0].orderQuantity).toBe(1);
    });
  });

  describe('removeCartProduct', () => {
    it('removes only the matching line and persists', () => {
      const { service, notify } = buildService();
      service.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }));
      service.addCartProduct(item({ id: 'p2', itemName: 'Shirt', price: 20 }));
      notify.calls.reset();

      service.removeCartProduct(item({ id: 'p1', itemName: 'Book' }));

      expect(service.getCartProducts()).toEqual([jasmine.objectContaining({ id: 'p2' })]);
      expect(storedCart().length).toBe(1);
      expect(notify).toHaveBeenCalledOnceWith(jasmine.objectContaining({ type: 'error' }));
    });
  });

  describe('clearCart', () => {
    it('clears the cart and the applied coupon after the user confirms', async () => {
      const { service, confirm } = buildService(true);
      service.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }));
      service.setCouponCode('SAVE10');

      await service.clearCart();

      expect(confirm).toHaveBeenCalled();
      expect(service.getCartProducts()).toEqual([]);
      expect(service.getCouponCode()).toBe('');
      expect(storedCart()).toEqual([]);
    });

    it('leaves everything untouched when the user cancels', async () => {
      const { service } = buildService(false);
      service.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }));
      service.setCouponCode('SAVE10');

      await service.clearCart();

      expect(service.getCartProducts().length).toBe(1);
      expect(service.getCouponCode()).toBe('SAVE10');
    });

    it('clearCartNoConfirmation skips the dialog entirely', () => {
      const { service, confirm } = buildService();
      service.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }));
      service.setCouponCode('SAVE10');

      service.clearCartNoConfirmation();

      expect(confirm).not.toHaveBeenCalled();
      expect(service.getCartProducts()).toEqual([]);
      expect(service.getCouponCode()).toBe('');
    });
  });

  describe('coupon code storage', () => {
    it('round-trips a coupon code through localStorage', () => {
      const { service } = buildService();

      service.setCouponCode('SAVE10');
      expect(service.getCouponCode()).toBe('SAVE10');

      service.setCouponCode('');
      expect(service.getCouponCode()).toBe('');
      expect(localStorage.getItem(COUPON_STORAGE_KEY)).toBeNull();
    });
  });

  describe('persisted cart summary (header badge contract)', () => {
    it('stores total quantity and the PricingService total (sale price preferred, per-unit discount applied)', () => {
      const { service } = buildService();
      // 2 x $10 plain + 1 x ($5 sale, $1/unit coupon discount) = 20 + 4 = 24
      service.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }), 2);
      service.addCartProduct(item({ id: 'p2', itemName: 'Shirt', price: 8, salePrice: 5, discount: 1 }), 1);

      const summary = JSON.parse(localStorage.getItem(SUMMARY_STORAGE_KEY) ?? '{}');

      expect(summary.quantity).toBe(3);
      expect(summary.total).toBe(24);
    });
  });

  describe('persistence and change notification', () => {
    it('a new service instance loads the cart persisted by a previous one', () => {
      const first = buildService().service;
      first.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }), 2);

      const second = buildService().service;

      expect(second.getCartProducts()).toEqual([jasmine.objectContaining({ id: 'p1', orderQuantity: 2 })]);
    });

    it('emits cartChanged$ on a microtask after a mutation (never synchronously)', async () => {
      const { service } = buildService();
      const emissions: CartItem[][] = [];
      service.cartChanged$.subscribe((cart) => emissions.push(cart));

      service.addCartProduct(item({ id: 'p1', itemName: 'Book', price: 10 }));

      // Synchronously we still only have the BehaviorSubject's initial
      // value -- the post-mutation emission is deliberately deferred (see
      // persist()'s NG0100 comment).
      expect(emissions.length).toBe(1);

      await Promise.resolve();

      expect(emissions.length).toBe(2);
      expect(emissions[1]).toEqual([jasmine.objectContaining({ id: 'p1' })]);
    });
  });
});
