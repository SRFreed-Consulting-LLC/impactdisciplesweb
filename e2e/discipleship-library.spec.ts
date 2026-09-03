import { test, expect, Page } from '@playwright/test';
import { APP_URLS } from '../src/common/src/shared/config/firebase-projects';

// The Impact Discipleship Library marketing page (/discipleship-library),
// added 2026-08-26 and linked from the FIRST slide of the home slider - so if
// this page breaks, the site's most prominent call to action leads nowhere.
//
// smoke.spec.ts loads one route per lazy module and this page shares
// ContentFeatureModule with /about-us, so smoke would stay green with this
// page entirely blank. What matters here is that the seven functional-group
// rows actually render, that their media loads (they are the whole argument
// for the app), and that both calls to action point at the reader.
//
// Reads only ambient impactdisciplesdev data and navigates nothing external.
//
// IT IS A KIT PAGE NOW. This was a bespoke component with its own `dl-*`
// markup; that component is gone and the page is an ordinary section stack
// like every other, so the locators below are the kit's (`kit-article`,
// `kit-strip__item`, `kit-hero__title`). The ASSERTIONS are unchanged - the
// seven groups, their order, their media, the two calls to action - because
// what the page must say did not change when how it is built did. All nine
// specs here were still asking for `dl-*` until 2026-09-03, and had been
// failing since the page was rebuilt.

// FROM THE SHARED CONFIG, not a literal. This suite runs against the DEV
// site (playwright.config.ts explains why), whose calls to action correctly
// point at the DEV reader - but the literal here was the PROD reader host,
// so `href*=` matched nothing and the test claimed the page had no calls to
// action at all. A hardcoded host in an environment-specific suite is a
// test that can only be right in one place.
const READER = new URL(APP_URLS.reader.dev).host;

/** The seven groups, in the order the page presents them. */
const GROUPS = [
  'Library & Books',
  'Reading & Lessons',
  'Impact Groups',
  'Messages',
  'Store',
  'Settings & Account',
  'Help',
];

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

test.describe('/discipleship-library', () => {
  test('renders the page shell and hero with no console errors', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/discipleship-library');

    await expect(page.locator('app-home-header')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('app-footer')).toBeVisible();
    await expect(page.locator('.kit-hero__title')).toContainText('discipleship library');
    expect(errors).toEqual([]);
  });

  test('states plainly that anyone can sign up', async ({ page }) => {
    // The one fact that decides whether a visitor bothers - confirmed with
    // the owner 2026-08-26 and easy to lose in a copy edit.
    await page.goto('/discipleship-library');

    await expect(page.locator('.kit-herosplit__note')).toContainText(/anyone can sign up/i);
  });

  test('shows all seven functional groups, in order', async ({ page }) => {
    await page.goto('/discipleship-library');
    await expect(page.locator('.kit-article')).toHaveCount(GROUPS.length, { timeout: 20000 });

    const tags = await page.locator('.kit-article__tag').allInnerTexts();
    for (let i = 0; i < GROUPS.length; i++) {
      expect(tags[i].toLowerCase()).toContain(GROUPS[i].toLowerCase());
    }
  });

  test('the jump strip lists every group the page goes on to cover', async ({ page }) => {
    // Strip and rows are rendered from the same array; if they ever disagree
    // one of them is being built by hand again.
    await page.goto('/discipleship-library');
    // allInnerTexts() does NOT auto-wait - without this the assertion can
    // read an empty list before the strip renders and fail intermittently.
    await expect(page.locator('.kit-strip__item')).toHaveCount(GROUPS.length, { timeout: 20000 });

    const strip = await page.locator('.kit-strip__item').allInnerTexts();
    // innerText applies the strip's text-transform, so compare lowercased.
    expect(strip.map((s) => s.trim().toLowerCase()))
      .toEqual(GROUPS.map((g) => g.toLowerCase()));
  });

  test('every row has media, and every image actually loads', async ({ page }) => {
    // A broken src still occupies the row, so "is visible" is not enough -
    // naturalWidth is the only thing that distinguishes a screenshot from a
    // broken-image icon. The whole page argues from these pictures.
    await page.goto('/discipleship-library');
    await expect(page.locator('.kit-article').first()).toBeVisible({ timeout: 20000 });

    // Scroll the lot into view: the row images are loading="lazy".
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));

    const media = await page.locator('.kit-article__media img, .kit-article__media video').count();
    expect(media).toBe(GROUPS.length);

    const broken = await page.locator('.kit-article__media img').evaluateAll(
      (imgs) => imgs.filter((i) => !(i as HTMLImageElement).naturalWidth)
        .map((i) => i.getAttribute('src')));
    expect(broken).toEqual([]);
  });

  test('the hero image loads too', async ({ page }) => {
    await page.goto('/discipleship-library');
    // The page's only image outside the article rows - the header's logo is
    // an <img> too, so this stays scoped to the kit's own class.
    const hero = page.locator('img.kit-img');
    await expect(hero).toBeVisible({ timeout: 20000 });

    await expect.poll(() => hero.evaluate((i) => (i as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  });

  test('every row is a still - the dictation clip is gone', async ({ page }) => {
    // Until 2026-09-03 the Reading & Lessons row was a muted looping .mp4.
    // The page draws every row's media in one phone-shaped box, and the
    // clip's aspect ratio letterboxed into it with a grey block under the
    // phone (owner, looking at the live page). It is a still now, like the
    // other six - so a video reappearing here is a regression, not a feature.
    await page.goto('/discipleship-library');
    await expect(page.locator('.kit-article').first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.kit-article__media video')).toHaveCount(0);

    // And the still is the dictation shot specifically, not a leftover.
    const srcs = await page.locator('.kit-article__media img')
      .evaluateAll((imgs) => imgs.map((i) => i.getAttribute('src') ?? ''));
    expect(srcs.some((s) => /dictation\.jpg/.test(s))).toBe(true);
  });

  test('both calls to action open the reader in a NEW tab, safely', async ({ page }) => {
    await page.goto('/discipleship-library');

    const ctas = page.locator(`a[href*="${READER}"]`);
    await expect(ctas).toHaveCount(2);          // hero + closing

    // Owner decision 2026-09-03: the reader opens BESIDE the marketing page,
    // not instead of it. The bespoke page hardcoded target="_blank"; the kit
    // page lost it when it was rebuilt (neither button carried `newTab`),
    // and the live site navigated away for four days. Both buttons carry
    // newTab: true now, in dev AND prod - this is the check that would have
    // gone red.
    //
    // noopener travels with _blank or the opened tab can reach back through
    // window.opener.
    for (const cta of await ctas.all()) {
      await expect(cta).toHaveAttribute('target', '_blank');
      await expect(cta).toHaveAttribute('rel', /noopener/);
    }
  });

  test('does not scroll sideways on a phone', async ({ page }) => {
    // The rows are a two-column flex layout that has to collapse; a
    // horizontal scrollbar on a phone is the classic way that fails.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/discipleship-library');
    await expect(page.locator('.kit-article').first()).toBeVisible({ timeout: 20000 });

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflows).toBe(false);
  });
});
