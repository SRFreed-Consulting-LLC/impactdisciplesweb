import { environment } from 'src/environments/environment';
import { CheckoutOrderService, CheckoutOrderRequest } from './checkout-order.service';
import { CloudFunctionsClient } from 'src/app/common/services/data/cloud-functions.client';

// Characterization suite written BEFORE the CloudFunctionsClient extraction
// (bucket A, web item 4). This service is the client half of the
// server-side-pricing fix - it is the money path - and it had no spec at
// all, which is a bad place to be before moving its transport underneath
// it.
//
// What is pinned: the URL each call posts to, the exact body shape, and -
// most importantly - the two error branches. These two calls are the only
// fetch sites in the app that read `error` out of the RESPONSE BODY rather
// than throwing a generic message, so the extraction has to preserve both
// the server-supplied message AND each call's own fallback wording.
//
// Hand-constructed, no TestBed; window.fetch is stubbed per spec.
describe('CheckoutOrderService', () => {
  let service: CheckoutOrderService;
  let calls: { url: string; init: RequestInit }[];
  let originalFetch: typeof window.fetch;

  const respond = (ok: boolean, body: unknown, status = ok ? 200 : 400) => {
    window.fetch = ((url: string, init: RequestInit) => {
      calls.push({ url, init });
      return Promise.resolve({
        ok, status, json: () => Promise.resolve(body)
      } as unknown as Response);
    }) as unknown as typeof window.fetch;
  };

  const request = (): CheckoutOrderRequest => ({
    firstName: 'Buyer', lastName: 'Test', email: 'buyer@test.local',
    cartItems: []
  } as unknown as CheckoutOrderRequest);

  beforeEach(() => {
    calls = [];
    originalFetch = window.fetch;
    // A real CloudFunctionsClient over a stub AttributionService. Only this
    // construction changed when the transport was extracted - every
    // assertion below is untouched, and each still exercises the whole path
    // from the service down to fetch.
    service = new CheckoutOrderService(
      new CloudFunctionsClient({ get: () => null } as never)
    );
  });

  afterEach(() => { window.fetch = originalFetch; });

  it('posts the order to create_paypal_order and returns the parsed result', async () => {
    respond(true, { free: false, orderId: 'ORDER-1' });

    const result = await service.createOrder(request());

    expect(calls.length).toBe(1);
    expect(calls[0].url).toBe(environment.createPaypalOrderUrl);
    expect(calls[0].init.method).toBe('POST');
    expect(JSON.parse(calls[0].init.body as string).email).toBe('buyer@test.local');
    expect(result).toEqual({ free: false, orderId: 'ORDER-1' } as never);
  });

  it('createOrder surfaces the server error message when there is one', async () => {
    respond(false, { error: 'Coupon is no longer valid' });

    await expectAsync(service.createOrder(request()))
      .toBeRejectedWithError('Coupon is no longer valid');
  });

  it('createOrder falls back to its own wording when the body has none', async () => {
    respond(false, {});

    await expectAsync(service.createOrder(request()))
      .toBeRejectedWithError('Failed to start checkout');
  });

  it('posts orderId and payerID to capture_paypal_order', async () => {
    respond(true, { checkoutForm: { id: 'p1' } });

    const result = await service.captureOrder('ORDER-1', 'PAYER-1');

    expect(calls[0].url).toBe(environment.capturePaypalOrderUrl);
    expect(JSON.parse(calls[0].init.body as string))
      .toEqual({ orderId: 'ORDER-1', payerID: 'PAYER-1' });
    expect(result).toEqual({ checkoutForm: { id: 'p1' } } as never);
  });

  it('captureOrder surfaces the server error message when there is one', async () => {
    // This branch matters more than most: capture failures can mean the
    // customer WAS charged (see the service's own recordingFailed note), so
    // the server's own wording must reach the caller intact.
    respond(false, { error: 'Payment was captured but the order could not be saved' });

    await expectAsync(service.captureOrder('ORDER-1'))
      .toBeRejectedWithError('Payment was captured but the order could not be saved');
  });

  it('captureOrder falls back to its own wording, distinct from createOrder', async () => {
    respond(false, {});

    await expectAsync(service.captureOrder('ORDER-1'))
      .toBeRejectedWithError('Failed to complete payment');
  });
});
