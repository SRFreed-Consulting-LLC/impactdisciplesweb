import { test, expect, Page } from '@playwright/test';

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

const READER = 'impactdisciples-library.web.app';

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
    await expect(page.locator('.dl-hero__title')).toContainText('discipleship library');
    expect(errors).toEqual([]);
  });

  test('states plainly that anyone can sign up', async ({ page }) => {
    // The one fact that decides whether a visitor bothers - confirmed with
    // the owner 2026-08-26 and easy to lose in a copy edit.
    await page.goto('/discipleship-library');

    await expect(page.locator('.dl-hero__free')).toContainText(/anyone can sign up/i);
  });

  test('shows all seven functional groups, in order', async ({ page }) => {
    await page.goto('/discipleship-library');
    await expect(page.locator('.dl-row')).toHaveCount(GROUPS.length, { timeout: 20000 });

    const tags = await page.locator('.dl-row__tag').allInnerTexts();
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
    await expect(page.locator('.dl-strip__item')).toHaveCount(GROUPS.length, { timeout: 20000 });

    const strip = await page.locator('.dl-strip__item').allInnerTexts();
    // innerText applies the strip's text-transform, so compare lowercased.
    expect(strip.map((s) => s.trim().toLowerCase()))
      .toEqual(GROUPS.map((g) => g.toLowerCase()));
  });

  test('every row has media, and every image actually loads', async ({ page }) => {
    // A broken src still occupies the row, so "is visible" is not enough -
    // naturalWidth is the only thing that distinguishes a screenshot from a
    // broken-image icon. The whole page argues from these pictures.
    await page.goto('/discipleship-library');
    await expect(page.locator('.dl-row').first()).toBeVisible({ timeout: 20000 });

    // Scroll the lot into view: the row images are loading="lazy".
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));

    const media = await page.locator('.dl-row__media img, .dl-row__media video').count();
    expect(media).toBe(GROUPS.length);

    const broken = await page.locator('.dl-row__media img').evaluateAll(
      (imgs) => imgs.filter((i) => !(i as HTMLImageElement).naturalWidth)
        .map((i) => i.getAttribute('src')));
    expect(broken).toEqual([]);
  });

  test('the hero image loads too', async ({ page }) => {
    await page.goto('/discipleship-library');
    const hero = page.locator('.dl-hero__shot img');
    await expect(hero).toBeVisible({ timeout: 20000 });

    await expect.poll(() => hero.evaluate((i) => (i as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  });

  test('the dictation row is a muted, looping, inline video', async ({ page }) => {
    // This row exists because the motion IS the point. Autoplay is blocked
    // unless it is muted, and an un-inlined video goes fullscreen on iOS -
    // either would make it useless exactly where most visitors are.
    await page.goto('/discipleship-library');
    const video = page.locator('.dl-row__media video');
    await expect(video).toHaveCount(1);

    const attrs = await video.evaluate((v: HTMLVideoElement) => ({
      muted: v.muted, loop: v.loop, autoplay: v.autoplay,
      inline: v.hasAttribute('playsinline'), src: v.getAttribute('src'),
    }));
    expect(attrs).toMatchObject({ muted: true, loop: true, autoplay: true, inline: true });
    expect(attrs.src).toContain('.mp4');
  });

  test('both calls to action point at the reader app', async ({ page }) => {
    await page.goto('/discipleship-library');

    const ctas = page.locator(`a[href*="${READER}"]`);
    await expect(ctas).toHaveCount(2);          // hero + closing
    for (const cta of await ctas.all()) {
      await expect(cta).toHaveAttribute('target', '_blank');
      // Without noopener the opened tab can reach back through window.opener.
      await expect(cta).toHaveAttribute('rel', /noopener/);
    }
  });

  test('does not scroll sideways on a phone', async ({ page }) => {
    // The rows are a two-column flex layout that has to collapse; a
    // horizontal scrollbar on a phone is the classic way that fails.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/discipleship-library');
    await expect(page.locator('.dl-row').first()).toBeVisible({ timeout: 20000 });

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflows).toBe(false);
  });
});
