import { test, expect, Page } from '@playwright/test';

// Smoke coverage for the store/cart/checkout (src/app/core/store/,
// routed at the canonical /store, /shopping-cart, /checkout,
// /checkout-success, /product-details/:id, /e-books paths -- this was
// originally built and run side by side with the old implementation at
// a separate /store-new/* sandbox for comparison, then promoted to replace it entirely; see
// the plan doc, "Reimagine Store / Cart / Checkout"). Mirrors
// smoke.spec.ts's pattern: against real dev data (impactdisciplesdev, per
// environment.local.ts), read-only except for the cart itself in
// localStorage, which is cleared at the start of each test.

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
  await page.goto('/store');
  await page.evaluate(() => {
    localStorage.removeItem('cart');
    localStorage.removeItem('cart-coupon');
    localStorage.removeItem('cart-summary');
  });
});

test('/store loads with no console errors', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  await page.goto('/store');

  await expect(page.locator('app-home-header')).toBeVisible();
  expect(errors, `console/page errors on /store:\n${errors.join('\n')}`).toEqual([]);
});

test('/e-books loads with no console errors', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  await page.goto('/e-books');

  await expect(page.locator('app-home-header')).toBeVisible();
  expect(errors, `console/page errors on /e-books:\n${errors.join('\n')}`).toEqual([]);
});

test('/shopping-cart loads empty with no console errors', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  await page.goto('/shopping-cart');

  await expect(page.locator('app-home-header')).toBeVisible();
  await expect(page.getByText('No Cart Items Found')).toBeVisible();
  expect(errors, `console/page errors on /shopping-cart:\n${errors.join('\n')}`).toEqual([]);
});

test('add to cart from /store updates the header cart badge and drawer', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  await page.goto('/store');
  const headerCartLink = page.locator('.header__content-cart li').first().locator('a');
  await expect(headerCartLink).toContainText('Cart (0)');
  await expect(page.locator('.header__content-cart .ion-bag')).toBeVisible();

  // /store defaults to the series view -- switch to the flat product grid
  // via the sidebar's "View All" button first (the filter <select> uses a
  // plain [value] binding + manual (change) handler rather than a form
  // control, which is flakier to drive from Playwright's selectOption than
  // a real button click). Wait for real category data (a live Firestore
  // read against dev data, not an emulator) before clicking, so the click
  // doesn't race the product list.
  // Wait for the category list to be POPULATED, not merely present: one
  // visible .accordion-item can paint before the live dev Firestore read
  // resolves, and clicking "View All" against an unloaded list no-ops - the
  // race this spec has always warned about, which showed up as an
  // intermittent timeout on the product grid below.
  const categories = page.locator('.accordion-item');
  await expect.poll(() => categories.count(), { timeout: 30000 })
    .toBeGreaterThan(1);
  await page.getByRole('button', { name: 'View All' }).first().click();

  // Wait for the flat grid to actually POPULATE, not just for one button to
  // paint. "View All" renders ~54 products from a live dev Firestore read,
  // and a fixed 15s wait on the first button was marginal - it passed when
  // this spec ran alone and timed out at 16.8s inside a full-suite run.
  // Asserting a non-zero count first fails with a useful message when the
  // data genuinely does not arrive, instead of a bare locator timeout.
  const addToCartButtons =
    page.locator('app-store-postbox-item .impact-icon-btn-blue');
  // Re-click if the first one was swallowed: the toggle is a plain button
  // with a manual handler, so a click landing mid-render is simply lost and
  // waiting longer never recovers it.
  await expect.poll(async () => {
    const count = await addToCartButtons.count();
    if (count === 0) {
      await page.getByRole('button', { name: 'View All' }).first()
        .click({ trial: false }).catch(() => undefined);
    }
    return count;
  }, { timeout: 30000 }).toBeGreaterThan(0);
  await addToCartButtons.first().click();

  await expect(headerCartLink).toContainText('Cart (1)');

  await headerCartLink.click();
  await expect(page.locator('.cart-drawer')).toBeVisible();
  await expect(page.locator('.cart-drawer__item')).toHaveCount(1);

  expect(errors, `console/page errors:\n${errors.join('\n')}`).toEqual([]);
});

test('/checkout with an empty cart shows the empty-cart message, no console errors', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  await page.goto('/checkout');

  await expect(page.locator('app-home-header')).toBeVisible();
  await expect(page.getByText('No items found in cart to checkout')).toBeVisible();
  expect(errors, `console/page errors on /checkout:\n${errors.join('\n')}`).toEqual([]);
});

test('/checkout-success with nothing pending shows the thank-you page, no console errors', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  await page.goto('/checkout-success');

  await expect(page.locator('app-home-header')).toBeVisible();
  await expect(page.getByText('Thank You')).toBeVisible();
  expect(errors, `console/page errors on /checkout-success:\n${errors.join('\n')}`).toEqual([]);
});
