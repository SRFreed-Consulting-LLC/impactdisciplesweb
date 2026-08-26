import { test, expect, Page } from '@playwright/test';

// Two areas the suite never touched.
//
// TEAM: smoke.spec.ts loads /team and asserts only "no console errors", which
// says nothing about whether a single person renders or whether clicking one
// reaches their page. /team-details had no coverage at all.
//
// EQUIPPING GROUPS: four routes describing an entire service line - the hub
// plus a page each for pastors, leaders and churches - none of them covered.
// They share a lazy module with /about-us, so smoke stays green if every one
// of them is blank.
//
// Reads only ambient impactdisciplesdev data and submits nothing.

test.describe.configure({ timeout: 60_000 });

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Every page on this site renders its own header and footer. */
async function expectShell(page: Page) {
  await expect(page.locator('app-home-header')).toBeVisible({ timeout: 25000 });
  await expect(page.locator('app-footer')).toBeVisible();
}

// ------------------------------------------------------------------- team

test.describe('/team', () => {
  test('lists actual people, not an empty grid', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/team');
    await expectShell(page);

    // A team page that renders its heading and no people is the failure mode
    // worth catching - it looks fine to a smoke test.
    const members = page.locator('a[href*="/team-details/"]');
    await expect.poll(() => members.count(), { timeout: 30000 }).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test('a team member opens their own page', async ({ page }) => {
    await page.goto('/team');
    const members = page.locator('a[href*="/team-details/"]');
    await expect.poll(() => members.count(), { timeout: 30000 }).toBeGreaterThan(0);

    await members.first().click();

    await expect(page).toHaveURL(/\/team-details\//, { timeout: 25000 });
    await expectShell(page);
    await expect(page.locator('h1, h2, h3').first()).not.toBeEmpty();
  });

  test('an unknown team member fails visibly rather than white-screening', async ({ page }) => {
    await page.goto('/team-details/no-such-person-at-all');

    await expectShell(page);
  });
});

// -------------------------------------------------------- equipping groups

const EQUIPPING = [
  { route: '/equipping-groups', name: 'the hub' },
  { route: '/equipping-groups-pastors', name: 'pastors' },
  { route: '/equipping-groups-leaders', name: 'leaders' },
  { route: '/equipping-groups-churches', name: 'churches' },
];

test.describe('equipping groups', () => {
  for (const { route, name } of EQUIPPING) {
    test(`${route} (${name}) renders real content with no console errors`, async ({ page }) => {
      const errors = collectErrors(page);

      await page.goto(route);
      await expectShell(page);

      // Enough prose to be a real page rather than a header sandwiching
      // nothing - the exact failure a shell-only assertion misses.
      const body = await page.locator('main, body').first().innerText();
      expect(body.length).toBeGreaterThan(400);
      expect(errors).toEqual([]);
    });
  }

  test('the hub links on to at least one of its audience pages', async ({ page }) => {
    // The three audience pages are reachable only from here; if the hub stops
    // linking to them they are effectively deleted.
    await page.goto('/equipping-groups');
    await expectShell(page);

    const onward = page.locator(
      'a[href*="equipping-groups-pastors"], a[href*="equipping-groups-leaders"], a[href*="equipping-groups-churches"]');
    await expect.poll(() => onward.count(), { timeout: 20000 }).toBeGreaterThan(0);
  });
});

// ------------------------------------------------------- remaining content

const STATIC_PAGES = [
  '/seminars',
  '/lunch-and-learns',
  '/customer-reviews',
  '/private-policy',
  '/terms',
  '/spanish-resources',
];

test.describe('remaining content routes', () => {
  for (const route of STATIC_PAGES) {
    test(`${route} renders the shell with no console errors`, async ({ page }) => {
      const errors = collectErrors(page);

      await page.goto(route);
      await expectShell(page);

      expect(errors).toEqual([]);
    });
  }
});
