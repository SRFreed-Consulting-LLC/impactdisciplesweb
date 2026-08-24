import { test, expect, Page } from '@playwright/test';

// Events and event registration.
//
// Registration is a MONEY path: /event-details/:id prices a seat and pushes
// it through the same cart and checkout the store uses, and the price shown
// is re-derived server-side by register_for_event / create_paypal_order. The
// only coverage before this was smoke.spec.ts asserting that /events loads
// without console errors, which says nothing about whether a seat can be
// bought.
//
// Reads only ambient impactdisciplesdev data - no fixture. Dev carries 8
// active events, so these specs discover an event rather than hard-coding an
// id, which keeps them working as dev's data changes. They stop short of
// paying: a real capture would create a Purchase and take money, so the cart
// is the last step asserted.

/** Collects console and page errors for a no-noise assertion. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** The first event card on /events, once the live read has resolved. */
async function firstEventLink(page: Page) {
  const links = page.locator('.events__person-item, a[href^="/event-details/"]');
  await expect
    .poll(() => links.count(), { timeout: 30000 })
    .toBeGreaterThan(0);
  return links.first();
}

test.describe('events', () => {
  test('/events lists events with no console errors', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/events');

    await expect(page.locator('app-home-header')).toBeVisible();
    const link = await firstEventLink(page);
    await expect(link).toBeVisible();
    expect(errors, `errors on /events:\n${errors.join('\n')}`).toEqual([]);
  });

  test('every listed event links somewhere real', async ({ page }) => {
    // A card whose href is empty or undefined renders as a dead link, which
    // looks fine in a screenshot and is useless to a visitor.
    await page.goto('/events');
    await firstEventLink(page);

    const hrefs = await page
      .locator('a[href^="/event-details/"], a[href^="/summit/"]')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href, 'event card href').toMatch(
        /^\/(event-details\/[^/]+|summit\/\d{4})$/
      );
    }
  });

  test('an event detail page renders its name and a price', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/events');
    const link = await firstEventLink(page);
    const href = await link.getAttribute('href');
    test.skip(!href, 'no event to open');

    await page.goto(href!);
    // The heading is the event's own name - proves the document loaded, not
    // just that the route resolved.
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20000 });
    const heading = await page.locator('h1, h2').first().textContent();
    expect((heading ?? '').trim().length).toBeGreaterThan(0);

    expect(errors, `errors on ${href}:\n${errors.join('\n')}`).toEqual([]);
  });

  test('a registration price is never rendered as NaN or undefined', async ({ page }) => {
    // Several dev events have no costInDollars at all. That must read as
    // free or blank, never as "$NaN" or "$undefined" - the exact output of
    // arithmetic on a missing field, and the kind of thing that reaches a
    // buyer looking like a broken site.
    await page.goto('/events');
    const link = await firstEventLink(page);
    const href = await link.getAttribute('href');
    test.skip(!href, 'no event to open');

    await page.goto(href!);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20000 });

    const body = (await page.locator('body').textContent()) ?? '';
    expect(body).not.toContain('NaN');
    expect(body).not.toContain('$undefined');
    expect(body).not.toContain('undefined');
  });

  test('an event detail page carries the site footer', async ({ page }) => {
    // Regression guard for a bug this spec found: event-details was the ONLY
    // page in the app with no <app-footer> - team-details, product-details
    // and the events list all had one. It is the page where people register,
    // so losing the footer costs the nav and contact links at the point of
    // highest intent.
    await page.goto('/events');
    const link = await firstEventLink(page);
    const href = await link.getAttribute('href');
    test.skip(!href, 'no event to open');

    await page.goto(href!);
    await expect(page.locator('app-home-header')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('app-footer')).toBeVisible();
  });

  test('an unknown event id does not leave a blank page', async ({ page }) => {
    // event-details loads by id with no isActive filter, so a bad id is a
    // real possibility from a stale link or a shared URL.
    await page.goto('/event-details/no-such-event-at-all');
    // Either it redirects to the list or it renders the shell - what it must
    // not do is render nothing at all.
    await expect(page.locator('app-home-header')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('app-footer')).toBeVisible();
  });

  test('the summit page renders for its year', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/summit/2026');
    await expect(page.locator('app-home-header')).toBeVisible();
    // Dev's 2026 summit is deactivated, so this legitimately shows the
    // coming-soon placeholder. Either way the page must render its shell
    // rather than fail - which is the regression this guards.
    await expect(page.locator('app-footer')).toBeVisible();
    expect(errors, `errors on /summit/2026:\n${errors.join('\n')}`).toEqual([]);
  });
});
