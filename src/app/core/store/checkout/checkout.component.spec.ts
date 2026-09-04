import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { PayPalScriptService } from 'ngx-paypal';
import { CheckoutForm } from '@impact-common/shared/models/utils/cart.model';
import { ShippingService } from 'src/app/common/services/data/shipping.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { LoggerService } from 'src/app/common/services/data/logger.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';
import { AttributionService, CampaignAttribution } from 'src/app/shared/utils/services/attribution.service';
import { CartService } from '../services/cart.service';
import { PricingService } from '../services/pricing.service';
import { ProductCatalogService } from '../services/product-catalog.service';
import { CheckoutOrderService, CheckoutOrderRequest } from '../services/checkout-order.service';
import { CheckoutComponent } from './checkout.component';

// buildOrderRequest() is the client side of the server-side-pricing fix
// (see CheckoutOrderService's header comment): the request the browser
// sends to create_paypal_order must NEVER carry a price, discount, or
// total -- the server prices the order from its own product data, so a
// devtools-tampered cart can't change what gets charged. These specs pin
// that contract by loading the cart with every price-bearing field a
// CartItem can carry and asserting none of them survive into the request.
//
// The component is hand-constructed (never TestBed); only FormBuilder is
// real -- it's the one dependency the field initializers actually run.
// ngOnInit() is deliberately not called, so none of the duck-typed
// services are ever touched.
const FORBIDDEN_KEYS = ['price', 'salePrice', 'discountPrice', 'total', 'amount', 'discount'];

function collectKeysDeep(value: unknown, keys: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectKeysDeep(entry, keys));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      keys.push(key);
      collectKeysDeep(child, keys);
    }
  }
  return keys;
}

function buildComponent(attribution: CampaignAttribution | null): CheckoutComponent {
  const attributionService = {
    get: jasmine.createSpy('get').and.returnValue(attribution)
  } as unknown as AttributionService;

  return new CheckoutComponent(
    {} as unknown as CartService,
    {} as unknown as PricingService,
    {} as unknown as CheckoutOrderService,
    {} as unknown as ShippingService,
    {} as unknown as ProductCatalogService,
    {} as unknown as WebConfigService,
    {} as unknown as PayPalScriptService,
    {} as unknown as Router,
    {} as unknown as ToastService,
    {} as unknown as LoggerService,
    attributionService,
    new FormBuilder()
  );
}

// A checkout form whose cart items are loaded with every price-bearing
// field -- exactly what a tampered client-side cart would look like.
function tamperedCheckoutForm(): CheckoutForm {
  return {
    cartItems: [
      {
        id: 'prod-1',
        itemName: 'Book',
        price: 0.01,
        salePrice: 0.01,
        discount: 99,
        discountPrice: 0.01,
        orderQuantity: 2,
        size: 'L',
        color: 'Blue',
        language: 'English',
        followUpEmailId: 'follow-up-1'
      },
      {
        id: 'event-1',
        itemName: 'Summit Ticket',
        price: 0,
        salePrice: 0,
        discount: 100,
        discountPrice: 0,
        isEvent: true,
        orderQuantity: 1,
        attendees: [{ firstName: 'Alex', lastName: 'Rivera', email: 'alex@example.com' }]
      },
      {
        id: 'ebook-1',
        isEBook: true,
        isDigitalBook: true,
        price: 12.5,
        orderQuantity: 1
      }
    ],
    couponCode: 'SAVE10',
    firstName: 'Alex',
    lastName: 'Rivera',
    email: 'alex@example.com',
    phone: { number: '555-0100' },
    isNewsletter: true,
    isShippingSameAsBilling: true,
    shippingAddress: { address1: '1 Main St', city: 'Atlanta', state: 'GA', zip: '30301', country: 'US' },
    shippingRate: 8.55,
    shippingRateId: { object_id: 'rate-1' },
    // Client-side aggregate fields a tampered form could carry -- must
    // never be forwarded.
    total: 0.01,
    discount: 999
  } as unknown as CheckoutForm;
}

// Private method -- reached via index access on purpose; this is the same
// object the real startOrder() sends.
function buildRequest(component: CheckoutComponent): CheckoutOrderRequest {
  return component['buildOrderRequest']();
}

// The payment step's entry point, with the shipping quote failing. Until
// 2026-09-03 a rejected quote threw past the lines that clear the spinners
// and the shopper sat on "Setting up payment..." with no error and no
// Retry - three hours of it on production the day ShipEngine refused every
// quote. Duck-typed deps: only the three the failure path touches are real
// objects; the order service is a spy that must NOT be reached.
describe('CheckoutComponent.quoteAndStartOrder', () => {
  function buildFailingQuoteComponent() {
    const createOrder = jasmine.createSpy('createOrder');
    const notify = jasmine.createSpy('notify');
    const logMessage = jasmine.createSpy('logMessage').and.returnValue({ subscribe: () => undefined });
    const component = new CheckoutComponent(
      {} as unknown as CartService,
      {} as unknown as PricingService,
      { createOrder } as unknown as CheckoutOrderService,
      { calculateShipping: () => Promise.reject(new Error('502 Unable to retrieve shipping rates')) } as unknown as ShippingService,
      {} as unknown as ProductCatalogService,
      {} as unknown as WebConfigService,
      {} as unknown as PayPalScriptService,
      {} as unknown as Router,
      { notify } as unknown as ToastService,
      { logMessage } as unknown as LoggerService,
      { get: () => null } as unknown as AttributionService,
      new FormBuilder()
    );
    component.checkoutForm = { email: 'alex@example.com', cartItems: [] } as unknown as CheckoutForm;
    return { component, createOrder, notify, logMessage };
  }

  it('a failed shipping quote clears the spinners, shows the error state, and never starts the order', async () => {
    const { component, createOrder, notify, logMessage } = buildFailingQuoteComponent();

    await component['quoteAndStartOrder']();

    expect(component.showShippingSpinner).toBeFalse();
    expect(component.showEstimatedTaxesSpinner).toBeFalse();
    expect(component.submitting).toBeFalse();
    expect(component.orderError).toBeTrue();
    expect(notify).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'error' }));
    expect(logMessage).toHaveBeenCalled();
    expect(createOrder).not.toHaveBeenCalled();
  });

  it('Retry goes back through the quote rather than reusing a rate that never arrived', async () => {
    const { component, createOrder } = buildFailingQuoteComponent();

    await component.retryOrder();

    expect(component.orderError).toBeTrue();
    expect(createOrder).not.toHaveBeenCalled();
  });
});

describe('CheckoutComponent.buildOrderRequest', () => {
  it('contains NO price-bearing field anywhere, even when the cart is loaded with them', () => {
    const component = buildComponent({ campaignId: 'camp-1' });
    component.checkoutForm = tamperedCheckoutForm();

    const request = buildRequest(component);
    const allKeys = collectKeysDeep(request);

    for (const forbidden of FORBIDDEN_KEYS) {
      expect(allKeys).not.toContain(forbidden);
    }
  });

  it('strips price fields from every cart item individually (not just the top level)', () => {
    const component = buildComponent(null);
    component.checkoutForm = tamperedCheckoutForm();

    const request = buildRequest(component);

    expect(request.cartItems.length).toBe(3);
    for (const item of request.cartItems) {
      for (const forbidden of FORBIDDEN_KEYS) {
        expect(Object.keys(item)).not.toContain(forbidden);
      }
    }
  });

  it('passes ids, quantities, and option selections through unchanged', () => {
    const component = buildComponent(null);
    component.checkoutForm = tamperedCheckoutForm();

    const request = buildRequest(component);
    const [book, eventItem, ebook] = request.cartItems;

    expect(book.id).toBe('prod-1');
    expect(book.orderQuantity).toBe(2);
    expect(book.size).toBe('L');
    expect(book.color).toBe('Blue');
    expect(book.language).toBe('English');
    expect(book.followUpEmailId).toBe('follow-up-1');

    expect(eventItem.id).toBe('event-1');
    expect(eventItem.isEvent).toBeTrue();
    expect(eventItem.orderQuantity).toBe(1);
    expect(eventItem.attendees).toEqual([{ firstName: 'Alex', lastName: 'Rivera', email: 'alex@example.com' }]);

    expect(ebook.isEBook).toBeTrue();
    expect(ebook.isDigitalBook).toBeTrue();
  });

  it('passes customer, shipping, and coupon-code fields through for the server to act on', () => {
    const component = buildComponent(null);
    component.checkoutForm = tamperedCheckoutForm();

    const request = buildRequest(component);

    // The coupon travels as a CODE only -- the server resolves what it is
    // worth. The shipping rate is a real-time carrier quote, sent for the
    // server to re-verify (see goToPayment()'s comment).
    expect(request.couponCode).toBe('SAVE10');
    expect(request.firstName).toBe('Alex');
    expect(request.lastName).toBe('Rivera');
    expect(request.email).toBe('alex@example.com');
    expect(request.isNewsletter).toBeTrue();
    expect(request.isShippingSameAsBilling).toBeTrue();
    expect(request.shippingAddress).toEqual(
      jasmine.objectContaining({ address1: '1 Main St', city: 'Atlanta', state: 'GA' })
    );
    expect(request.shippingRate).toBe(8.55);
    expect(request.shippingRateId).toEqual({ object_id: 'rate-1' });
  });

  it('attaches the captured campaign attribution when one is present', () => {
    const attribution = { campaignId: 'camp-1', emailId: 'email-1', source: 'popup' };
    const component = buildComponent(attribution);
    component.checkoutForm = tamperedCheckoutForm();

    expect(buildRequest(component).attribution).toEqual(attribution);
  });

  it('omits the attribution key entirely (not undefined) when none was captured', () => {
    const component = buildComponent(null);
    component.checkoutForm = tamperedCheckoutForm();

    const request = buildRequest(component);

    expect('attribution' in request).toBeFalse();
  });
});
