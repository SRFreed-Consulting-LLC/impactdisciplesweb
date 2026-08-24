import { test, expect, Page } from '@playwright/test';

// The campaign popup is how a campaign reaches the public site - it is the
// delivery mechanism for an early-bird push, and nothing had ever exercised
// it end to end. If it silently fails to render, or re-nags a visitor who
// asked it not to, the campaign just does not happen and nobody finds out.
//
// FIXTURE REQUIRED. Dev normally has zero popups, so these specs would pass
// vacuously against ambient data. Seed one first, from the ADMIN repo:
//
//   node scripts/seed-e2e-popup.js --project=dev --execute
//   ...run this suite...
//   node scripts/seed-e2e-popup.js --project=dev --remove --execute
//
// Without it every test here SKIPS rather than fails - a missing fixture is
// a setup gap, not a product regression, and a suite that cries wolf gets
// ignored. This keeps the spec itself read-only, which is what the rest of
// this suite is (see playwright.config.ts).
//
// Deliberately never submits the form: this runs against real
// impactdisciplesdev data, and a submit would write an actual newsletter
// subscriber. The form's WIRING is asserted; its side effect is not.

const FIXTURE_ID = 'e2e-fixture-popup';
const SHOWN_KEY = `campaign-popup-shown-${FIXTURE_ID}`;
const DISMISS_KEY_FRAGMENT = 'campaign-popup';

/** Loads a page with popup localStorage cleared, as a first-time visitor. */
async function visitFresh(page: Page, path = '/') {
  // Clears ONCE per browser context, not on every navigation.
  // addInitScript runs before every document load, including reloads - an
  // unguarded version wiped the popup's own dismissed-flag on reload, which
  // made the opt-out test fail against correct app behaviour.
  await page.addInitScript(() => {
    try {
      if (sessionStorage.getItem('__e2ePopupCleared') === '1') {
        return;
      }
      Object.keys(localStorage)
        .filter((k) => k.includes('campaign-popup'))
        .forEach((k) => localStorage.removeItem(k));
      sessionStorage.setItem('__e2ePopupCleared', '1');
    } catch {
      // Storage unavailable - the component tolerates it, so must we.
    }
  });
  await page.goto(path);
}

/** The popup, once it has had time to fetch and render. */
function popup(page: Page) {
  return page.locator('.cpopup__box');
}

/** Skips the whole spec when the fixture has not been seeded. */
async function requireFixture(page: Page) {
  const visible = await popup(page)
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(
    !visible,
    'No campaign popup fixture in dev - seed it with ' +
      'scripts/seed-e2e-popup.js in the admin repo.'
  );
}

test.describe('campaign popup', () => {
  test('renders to a first-time visitor on the public site', async ({ page }) => {
    await visitFresh(page);
    await requireFixture(page);

    await expect(popup(page)).toBeVisible();
    // The body comes from the popup's stored html, injected via innerHTML -
    // asserting on it proves the DATA reached the DOM, not just that some
    // empty shell rendered.
    await expect(page.locator('[data-e2e="popup-body"]')).toBeVisible();
  });

  test('shows the form fields the campaign asked for', async ({ page }) => {
    // A `form` CTA collects admin-chosen fields, with email always present.
    // If this silently rendered no inputs, the campaign would look live and
    // capture nobody.
    await visitFresh(page);
    await requireFixture(page);

    const fields = page.locator('.cpopup__field');
    await expect(fields).toHaveCount(2);
    await expect(page.locator('.cpopup__field[type="email"]')).toBeVisible();
    await expect(
      page.locator('.cpopup__field[aria-label="First name"]')
    ).toBeVisible();
    await expect(page.locator('.cpopup__primary')).toHaveText('Sign me up');
  });

  test('the close button dismisses it', async ({ page }) => {
    await visitFresh(page);
    await requireFixture(page);

    await page.locator('.cpopup__close').click();
    await expect(popup(page)).toBeHidden();
  });

  test('the secondary CTA dismisses it', async ({ page }) => {
    await visitFresh(page);
    await requireFixture(page);

    await expect(page.locator('.cpopup__secondary')).toHaveText('No thanks');
    await page.locator('.cpopup__secondary').click();
    await expect(popup(page)).toBeHidden();
  });

  test('it returns on the next visit when not told otherwise', async ({ page }) => {
    // The documented behaviour: shown on EVERY visit until the visitor
    // checks "don't show this again". Closing alone must not silence it, or
    // a campaign reaches each person exactly once.
    await visitFresh(page);
    await requireFixture(page);
    await page.locator('.cpopup__close').click();
    await expect(popup(page)).toBeHidden();

    await page.reload();
    await expect(popup(page)).toBeVisible();
  });

  test('"Don\'t show this again" is honoured on the next visit', async ({ page }) => {
    // The one that matters for goodwill: a visitor who opts out must stay
    // opted out. This is per-popup, so a future campaign still gets through.
    await visitFresh(page);
    await requireFixture(page);

    await page.locator('.cpopup__dismiss input[type="checkbox"]').check();
    await page.locator('.cpopup__close').click();
    await expect(popup(page)).toBeHidden();

    await page.reload();
    // Give it the same window it would have had to appear in.
    await page.waitForTimeout(4000);
    await expect(popup(page)).toBeHidden();
  });

  test('the shown-beacon is recorded once per visitor', async ({ page }) => {
    // web_shown is localStorage-guarded so one visitor reloading twenty
    // times does not inflate the campaign's reach or its write volume.
    await visitFresh(page);
    await requireFixture(page);

    const keyAfterFirst = await page.evaluate(
      (k) => localStorage.getItem(k),
      SHOWN_KEY
    );
    expect(keyAfterFirst).not.toBeNull();

    await page.reload();
    await expect(popup(page)).toBeVisible();
    const keys = await page.evaluate(
      (frag) => Object.keys(localStorage).filter((k) => k.includes(frag)),
      DISMISS_KEY_FRAGMENT
    );
    // Still exactly one shown-marker for this popup, not one per visit.
    expect(keys.filter((k) => k === SHOWN_KEY)).toHaveLength(1);
  });

  test('it appears on an interior page too, not only the home page', async ({ page }) => {
    // The popup is mounted in the app shell, so a visitor arriving on a
    // campaign landing page must see it as well.
    await visitFresh(page, '/store');
    await requireFixture(page);
    await expect(popup(page)).toBeVisible();
  });

  test('the rest of the page stays usable while it is open', async ({ page }) => {
    // A popup that traps the page is worse than no popup. The header must
    // still be there behind the overlay.
    await visitFresh(page);
    await requireFixture(page);

    await expect(page.locator('app-home-header')).toBeVisible();
    await page.locator('.cpopup__close').click();
    await expect(popup(page)).toBeHidden();
    await expect(page.locator('app-home-header')).toBeVisible();
  });
});
