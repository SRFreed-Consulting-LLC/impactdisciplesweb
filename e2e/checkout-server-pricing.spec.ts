import { test, expect, Page } from '@playwright/test';

// Verifies the server-side price/payment verification ported from the
// separate checkout-server-side-pricing branch (see checkout-order.service.ts's
// own comment for the full story) without ever hitting the real
// create_paypal_order/capture_paypal_order Cloud Functions -- those write a
// real "purchases" doc, send a real receipt email, and (for a
// newsletter-opted-in order) subscribe a real email address, none of which
// belongs in an automated test run. Instead this intercepts the request
// checkout.component.ts sends and asserts on its shape directly, which is
// the actual security property being tested: the client must never send a
// price, only item ids/quantities/selections (see buildOrderRequest()).
// The (mocked) response is then used to confirm the component reacts
// correctly to both a free-order and a paid-order server decision.

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => errors.push(err.message));
  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/e-books');
  await page.evaluate(() => {
    localStorage.removeItem('cart');
    localStorage.removeItem('cart-coupon');
    localStorage.removeItem('cart-summary');
    localStorage.removeItem('checkoutForm');
  });
});

async function addFreeEbookToCart(page: Page): Promise<void> {
  await page.goto('/e-books');
  await page.getByRole('button', { name: 'FREE E-BOOKS' }).click();

  const firstAddToCart = page.locator('app-store-postbox-item .impact-icon-btn-blue').first();
  await firstAddToCart.waitFor({ state: 'visible', timeout: 15000 });
  await firstAddToCart.click();
}

async function fillCustomerForm(page: Page): Promise<void> {
  await page.locator('#checkout-firstName').fill('Test');
  await page.locator('#checkout-lastName').fill('Buyer');
  await page.locator('#checkout-email').fill('test-buyer@example.com');
  await page.locator('#checkout-phone').fill('5555555555');
  // E-books don't need a shipping address (isShippingAddressNeeded() is
  // false), so the shipping-address fields never render for this cart.
}

test('checkout never sends pricing to the server, and finishes a free order using only the server response', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  await addFreeEbookToCart(page);
  await page.goto('/checkout');
  await fillCustomerForm(page);

  let requestBody: any;
  await page.route('**/create_paypal_order', async route => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        free: true,
        checkoutForm: {
          id: 'mock-purchase-id',
          firstName: 'Test',
          lastName: 'Buyer',
          email: 'test-buyer@example.com',
          isNewsletter: false,
          couponCode: '',
          cartItems: [],
          receipt: 'FREE ONLY',
          total: 0,
          discount: 0
        }
      })
    });
  });

  await page.getByRole('button', { name: 'Continue to Payment' }).click();

  // A mocked free-order response should carry the component straight
  // through to the confirmation page with no PayPal widget ever rendered.
  await expect(page).toHaveURL(/\/checkout-success/, { timeout: 15000 });
  await expect(page.getByText('Thank You')).toBeVisible();

  expect(requestBody, 'checkout should have called create_paypal_order').toBeTruthy();
  expect(requestBody.cartItems.length).toBeGreaterThan(0);

  // The actual security property: no price field of any kind on the
  // request, on the order itself or on any cart item -- only ids,
  // quantities, and selections. See CheckoutOrderRequest's own comment.
  const forbiddenKeys = ['price', 'salePrice', 'discountPrice', 'total', 'amount', 'discount'];
  const bodyKeys = Object.keys(requestBody);
  const itemKeys = Object.keys(requestBody.cartItems[0]);
  for (const key of forbiddenKeys) {
    expect(bodyKeys, `request body must not include '${key}'`).not.toContain(key);
    expect(itemKeys, `cart item must not include '${key}'`).not.toContain(key);
  }

  expect(errors, `console/page errors:\n${errors.join('\n')}`).toEqual([]);
});

test('checkout renders the PayPal widget from a server-created order id, without computing its own total', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  await addFreeEbookToCart(page);
  await page.goto('/checkout');
  await fillCustomerForm(page);

  await page.route('**/create_paypal_order', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        free: false,
        orderId: 'MOCK-PAYPAL-ORDER-ID',
        breakdown: {
          subtotal: 9.99,
          totalDiscount: 0,
          estimatedTaxes: 0,
          taxRate: 0,
          taxSource: 'none',
          shippingDiscount: 0,
          shippingDiscountReason: '',
          total: 9.99
        }
      })
    });
  });

  await page.getByRole('button', { name: 'Continue to Payment' }).click();

  // Should stay on /checkout and render the PayPal widget rather than
  // auto-finishing -- a paid order can only be completed by capturing
  // real payment.
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.locator('.paypal-background')).toBeVisible({ timeout: 15000 });

  expect(errors, `console/page errors:\n${errors.join('\n')}`).toEqual([]);
});
