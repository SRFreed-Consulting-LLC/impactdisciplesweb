import { CartItem, CheckoutForm } from '@impact-common/shared/models/utils/cart.model';
import { PricingService } from './pricing.service';

// PricingService is the ONE place the store decides what a line costs (it
// replaced three disagreeing calculators - see the service's own header),
// so every storefront money figure a customer sees flows through here. It
// has no dependencies at all, so a plain `new PricingService()` is the
// whole setup - no TestBed, matching the house convention.
//
// The rules being pinned: salePrice (when > 0) is the base unit price, a
// coupon's per-unit `discount` layers on top of that, and every non-numeric
// or missing field degrades to 0 rather than producing NaN in a total.

function item(overrides: Partial<CartItem> = {}): CartItem {
  return { id: 'p1', price: 10, orderQuantity: 1, ...overrides } as CartItem;
}

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
  });

  describe('effectiveUnitPrice', () => {
    it('prefers salePrice when it is a positive number', () => {
      expect(service.effectiveUnitPrice(item({ price: 10, salePrice: 7 }))).toBe(7);
    });

    it('falls back to price when salePrice is 0, negative or missing', () => {
      expect(service.effectiveUnitPrice(item({ price: 10, salePrice: 0 }))).toBe(10);
      expect(service.effectiveUnitPrice(item({ price: 10, salePrice: -3 }))).toBe(10);
      expect(service.effectiveUnitPrice(item({ price: 10 }))).toBe(10);
    });

    it('falls back to price when salePrice is not a number (bad record)', () => {
      expect(service.effectiveUnitPrice(item({ price: 10, salePrice: undefined }))).toBe(10);
      expect(service.effectiveUnitPrice(item({ price: 10, salePrice: NaN }))).toBe(10);
      expect(service.effectiveUnitPrice(item({ price: 10, salePrice: '5' as unknown as number }))).toBe(10);
    });

    it('is 0 - never NaN - when price itself is missing or non-numeric', () => {
      expect(service.effectiveUnitPrice(item({ price: undefined }))).toBe(0);
      expect(service.effectiveUnitPrice(item({ price: NaN }))).toBe(0);
      expect(service.effectiveUnitPrice(item({ price: '10' as unknown as number }))).toBe(0);
    });
  });

  describe('unitDiscount', () => {
    it('is the item discount when numeric, else 0', () => {
      expect(service.unitDiscount(item({ discount: 2.5 }))).toBe(2.5);
      expect(service.unitDiscount(item())).toBe(0);
      expect(service.unitDiscount(item({ discount: NaN }))).toBe(0);
    });
  });

  describe('line math', () => {
    it('multiplies the effective unit price by quantity', () => {
      expect(service.lineSubtotal(item({ price: 10, orderQuantity: 3 }))).toBe(30);
      expect(service.lineSubtotal(item({ price: 10, salePrice: 7, orderQuantity: 3 }))).toBe(21);
    });

    it('treats a missing quantity as 0 rather than NaN', () => {
      expect(service.lineSubtotal(item({ orderQuantity: undefined }))).toBe(0);
      expect(service.lineDiscountTotal(item({ discount: 5, orderQuantity: undefined }))).toBe(0);
    });

    it('layers the per-unit coupon discount on top of the sale price', () => {
      // sale 7, coupon 2/unit, qty 3 -> subtotal 21, discount 6, total 15
      const line = item({ price: 10, salePrice: 7, discount: 2, orderQuantity: 3 });
      expect(service.lineSubtotal(line)).toBe(21);
      expect(service.lineDiscountTotal(line)).toBe(6);
      expect(service.lineTotal(line)).toBe(15);
    });
  });

  describe('cart math', () => {
    const cart = [
      item({ price: 10, orderQuantity: 2 }),                           // 20
      item({ price: 20, salePrice: 15, discount: 5, orderQuantity: 1 }) // 15 - 5
    ];

    it('sums subtotal, discount and total across lines', () => {
      expect(service.cartSubtotal(cart)).toBe(35);
      expect(service.cartDiscount(cart)).toBe(5);
      expect(service.cartTotal(cart)).toBe(30);
    });

    it('handles an empty or null cart as 0', () => {
      expect(service.cartSubtotal([])).toBe(0);
      expect(service.cartTotal(null as unknown as CartItem[])).toBe(0);
      expect(service.cartDiscount(undefined as unknown as CartItem[])).toBe(0);
    });
  });

  describe('orderTotal', () => {
    it('is subtotal - discount + taxes + shipping - shipping discount', () => {
      const form = {
        cartItems: [item({ price: 50, discount: 5, orderQuantity: 2 })], // 100 - 10
        estimatedTaxes: 7,
        shippingRate: 12,
        shippingDiscount: 4
      } as CheckoutForm;
      expect(service.orderTotal(form)).toBe(105); // 100 - 10 + 7 + 12 - 4
    });

    it('NaN-guards every optional money field', () => {
      const form = {
        cartItems: [item({ price: 25, orderQuantity: 1 })],
        estimatedTaxes: undefined,
        shippingRate: NaN,
        shippingDiscount: 'free' as unknown as number
      } as CheckoutForm;
      expect(service.orderTotal(form)).toBe(25);
    });

    it('is 0 for an empty/absent form rather than NaN', () => {
      expect(service.orderTotal({} as CheckoutForm)).toBe(0);
      expect(service.orderTotal(null as unknown as CheckoutForm)).toBe(0);
    });
  });

  describe('toCartLineItem', () => {
    it('reports a coupon discount reason when a per-unit discount applies', () => {
      const line = service.toCartLineItem(item({ price: 10, salePrice: 8, discount: 1, orderQuantity: 2 }));
      expect(line.discountReason).toBe('coupon');
      expect(line.unitPrice).toBe(8);
      expect(line.unitDiscount).toBe(1);
      expect(line.lineSubtotal).toBe(16);
      expect(line.lineTotal).toBe(14);
    });

    it('reports a sale reason when only a sale price applies', () => {
      const line = service.toCartLineItem(item({ price: 10, salePrice: 8 }));
      expect(line.discountReason).toBe('sale');
    });

    it('reports no reason when the item is at full price', () => {
      expect(service.toCartLineItem(item({ price: 10 })).discountReason).toBeUndefined();
    });

    it('classifies the line kind from the item flags', () => {
      expect(service.toCartLineItem(item({ isEvent: true })).kind).toBe('event');
      expect(service.toCartLineItem(item({ isDigitalBook: true })).kind).toBe('digitalBook');
      expect(service.toCartLineItem(item({ isEBook: true })).kind).toBe('ebook');
      expect(service.toCartLineItem(item()).kind).toBe('physical');
    });

    it('maps a whole cart, preserving order', () => {
      const lines = service.toCartLineItems([item({ id: 'a' }), item({ id: 'b' })]);
      expect(lines.map(line => line.item.id)).toEqual(['a', 'b']);
      expect(service.toCartLineItems(null as unknown as CartItem[])).toEqual([]);
    });
  });
});
