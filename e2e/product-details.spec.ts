import { test, expect, Page } from '@playwright/test';

// The product page (/product-details/:id) - the step between browsing and a
// cart, and until now the largest uncovered hole in the storefront.
//
// store.spec.ts adds to cart from the LIST page, so every assertion there
// stays green even if the product page is blank, priced wrong, or has a dead
// Add to Cart. This spec drives the journey a buyer actually takes: store ->
// a product -> its own page -> the cart.
//
// Reads ambient impactdisciplesdev data and never completes a checkout: the
// cart is a local concern, but an order writes a purchase, mails a receipt
// and can charge a card. Adding to the cart is asserted; buying is not.

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Empties the cart so a run never inherits the last one's state. */
async function clearCart(page: Page) {
  await page.goto('/store');
  await page.evaluate(() => {
    try {
      localStorage.removeItem('cart');
    } catch {
      // private mode - the cart is empty anyway
    }
  });
}

/**
 * Opens the store and clicks through to the first product's own page.
 *
 * /store opens on the SERIES view, which contains no product links at all -
 * the flat grid is behind the sidebar's "View All". Both waits below are
 * load-bearing and are the ones store.spec.ts documents: the category list
 * must be POPULATED before clicking (clicking an unloaded list silently
 * no-ops), and the grid must populate after it, because these are live reads
 * against dev data rather than an emulator.
 */
async function openFirstProduct(page: Page): Promise<void> {
  await page.goto('/store');

  const categories = page.locator('.accordion-item');
  await expect.poll(() => categories.count(), { timeout: 30000 }).toBeGreaterThan(1);

  // The click still races the product read often enough to matter: a
  // populated category list does not mean the products behind View All have
  // arrived, and a click that lands early silently renders an empty grid
  // with no error. Re-clicking is the only reliable signal - polling alone
  // waits out a grid that is never going to fill.
  const links = page.locator('a[href*="/product-details/"]');
  const viewAll = page.getByRole('button', { name: 'View All' }).first();
  for (let attempt = 0; attempt < 4; attempt++) {
    await viewAll.click();
    try {
      await expect.poll(() => links.count(), { timeout: 8000 }).toBeGreaterThan(0);
      break;
    } catch {
      if (attempt === 3) {
        throw new Error('the store grid never populated after 4 View All clicks');
      }
    }
  }

  await links.first().click();
  await expect(page).toHaveURL(/\/product-details\//, { timeout: 25000 });
}

/** The page's own Add to Cart, not a related product's. */
function addToCart(page: Page) {
  return page.getByRole('button', { name: /add to cart|add to bag|buy/i }).first();
}

// Live Firestore reads against dev, plus a cold lazy-chunk compile on the
// first navigation - the default 30s test timeout expires before the
// category/grid polls below can even finish on a cold run.
test.describe.configure({ timeout: 90_000 });

test.describe('/product-details', () => {
  test('the store grid links through to a product page', async ({ page }) => {
    // If this fails nothing below can run - and the storefront has no path
    // from browsing to buying.
    await openFirstProduct(page);

    await expect(page).toHaveURL(/\/product-details\/.+/);
  });

  test('a product page renders the shell and a title, with no console errors', async ({ page }) => {
    const errors = collectErrors(page);

    await openFirstProduct(page);

    await expect(page.locator('app-home-header')).toBeVisible();
    await expect(page.locator('app-footer')).toBeVisible();
    await expect(page.locator('h1, h2, h3').first()).not.toBeEmpty();
    expect(errors).toEqual([]);
  });

  test('shows a price', async ({ page }) => {
    // A product page that renders everything except the price still loses the
    // sale, and nothing else in the suite would notice.
    await openFirstProduct(page);

    await expect(page.locator('body')).toContainText(/\$\s?\d/, { timeout: 20000 });
  });

  test('adding to the cart from the product page updates the header badge', async ({ page }) => {
    await clearCart(page);
    await openFirstProduct(page);

    const add = addToCart(page);
    await expect(add).toBeVisible({ timeout: 20000 });
    await add.click();

    // The badge is the only feedback a buyer gets that the click worked.
    const cart = page.locator('.header__content-cart li').first().locator('a');
    await expect(cart).not.toContainText('Cart (0)', { timeout: 15000 });
  });

  test('the added product then appears in the cart', async ({ page }) => {
    await clearCart(page);
    await openFirstProduct(page);
    const add = addToCart(page);
    await expect(add).toBeVisible({ timeout: 20000 });
    await add.click();
    await page.waitForTimeout(1200);

    await page.goto('/shopping-cart');

    await expect(page.locator('body'))
      .not.toContainText(/your cart is empty/i, { timeout: 20000 });
  });

  test('an unknown product id fails visibly rather than white-screening', async ({ page }) => {
    // The route matches on its first segment alone, so a bad id reaches the
    // component rather than the 404 page - it has to handle that itself.
    await page.goto('/product-details/no-such-product-at-all');

    await expect(page.locator('app-home-header')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('app-footer')).toBeVisible();
  });
});
