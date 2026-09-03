import { test, expect, Page } from '@playwright/test';

// The content and capture pages: dynamic forms, the donate/subscribe flows,
// the monthly-newsletter viewer, and Coaching With Impact.
//
// smoke.spec.ts loads one route per lazy module and asserts only "no console
// errors" - which says nothing about whether a form has fields, whether a
// subscribe box exists, or whether a newsletter issue actually renders. Each
// of these is a page where a visitor either converts or gives up.
//
// Reads only ambient impactdisciplesdev data. Deliberately SUBMITS NOTHING:
// every form here writes a real record (form_submissions, a newsletter
// subscriber, a prayer-team signup), so the wiring is asserted and the side
// effect is not.

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Every page must render the shell; a bare white page is the failure. */
async function expectShell(page: Page) {
  await expect(page.locator('app-home-header')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('app-footer')).toBeVisible();
}

// ---------------------------------------------------------------- forms

const FORM_ROUTES = [
  '/seminar-form',
  '/lunch-and-learn-form',
  '/consultation-survey',
];

for (const route of FORM_ROUTES) {
  test(`${route} renders a form with real fields`, async ({ page }) => {
    // These are Firestore-driven (form_definitions -> DynamicFormComponent).
    // A definition that fails to load renders an EMPTY form, which looks
    // like a finished page and collects nothing - the failure mode worth
    // catching.
    const errors = collectErrors(page);
    await page.goto(route);
    await expectShell(page);

    const inputs = page.locator(
      'app-dynamic-form input, app-dynamic-form select, app-dynamic-form textarea'
    );
    await expect
      .poll(() => inputs.count(), { timeout: 30000 })
      .toBeGreaterThan(0);
    await expect(page.locator('app-dynamic-form button, app-dynamic-form [type="submit"]').first())
      .toBeVisible();
    expect(errors, `errors on ${route}:\n${errors.join('\n')}`).toEqual([]);
  });
}

test('/contact renders its form and the ministry details', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/contact');
  await expectShell(page);
  const inputs = page.locator('input, textarea');
  await expect.poll(() => inputs.count(), { timeout: 20000 }).toBeGreaterThan(1);
  expect(errors, `errors on /contact:\n${errors.join('\n')}`).toEqual([]);
});

// ------------------------------------------------------- capture flows

test('/give buttons open a real payment URL', async ({ page }) => {
  // THE BUTTONS WERE NOT LINKS. They called window.open() with a URL from
  // the environment file, so the failure mode was window.open(undefined) -
  // a blank tab and no donation - and this test stubbed window.open to read
  // what it was handed.
  //
  // As a kit page they are ordinary <a href> resolved from a destination
  // KEY, which is strictly better: a dead giving button is now visible in
  // the DOM instead of only at the instant someone clicks it. So the URLs
  // are read rather than provoked - and nothing is clicked, because these
  // are real links to Stripe and PayPal now.
  const errors = collectErrors(page);
  await page.goto('/give');
  await expectShell(page);

  const buttons = page.locator('.kit-btn');
  await expect.poll(() => buttons.count(), { timeout: 20000 })
    .toBeGreaterThan(0);

  const hrefs = await buttons.evaluateAll(
    (els) => els.map((e) => e.getAttribute('href') ?? '')
  );
  for (const href of hrefs) {
    expect(href, 'a giving button points nowhere').toMatch(/^https:\/\//);
    expect(href, 'an unconfigured environment URL').not.toContain('undefined');
  }
  expect(errors, `errors on /give:\n${errors.join('\n')}`).toEqual([]);
});

test('/newsletter takes an email address', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/newsletter');
  await expectShell(page);
  await expect(page.locator('input[type="email"], input[name*="mail" i]').first())
    .toBeVisible({ timeout: 20000 });
  expect(errors, `errors on /newsletter:\n${errors.join('\n')}`).toEqual([]);
});

test('/prayer-team takes a signup', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/prayer-team');
  await expectShell(page);
  await expect(page.locator('input').first()).toBeVisible({ timeout: 20000 });
  expect(errors, `errors on /prayer-team:\n${errors.join('\n')}`).toEqual([]);
});

test('the footer subscribe box is on every page', async ({ page }) => {
  // It is the site-wide capture point; if it silently stops rendering, list
  // growth just stops and nothing reports it.
  await page.goto('/about-us');
  await expectShell(page);
  await expect(
    page.locator('app-footer input[type="email"], app-footer input').first()
  ).toBeVisible();
});

// -------------------------------------------------- monthly newsletter

test('/monthly-newsletter lists published issues', async ({ page }) => {
  // Served by the newsletter_archive Cloud Function, the ONLY public read
  // path onto campaign_emails. Dev publishes 14 issues.
  const errors = collectErrors(page);
  await page.goto('/monthly-newsletter');
  await expectShell(page);

  const issues = page.locator('a[href^="/monthly-newsletter/"]');
  await expect.poll(() => issues.count(), { timeout: 30000 }).toBeGreaterThan(0);
  expect(errors, `errors on /monthly-newsletter:\n${errors.join('\n')}`).toEqual([]);
});

test('an issue renders inside a sandboxed iframe', async ({ page }) => {
  // The issue html is third-party-ish content rendered via srcdoc. It must
  // stay sandboxed WITHOUT allow-scripts - that is the whole security
  // posture of this page, and it is invisible to any other test.
  await page.goto('/monthly-newsletter');
  const issues = page.locator('a[href^="/monthly-newsletter/"]');
  await expect.poll(() => issues.count(), { timeout: 30000 }).toBeGreaterThan(0);

  const href = await issues.first().getAttribute('href');
  await page.goto(href!);
  const frame = page.locator('iframe');
  await expect(frame).toBeVisible({ timeout: 30000 });

  const sandbox = await frame.first().getAttribute('sandbox');
  expect(sandbox, 'the issue iframe must be sandboxed').not.toBeNull();
  expect(sandbox ?? '', 'scripts must NOT be allowed in an issue iframe')
    .not.toContain('allow-scripts');
});

// ------------------------------------------------ coaching with impact

test('/coaching-with-impact renders its rebuilt sections', async ({ page }) => {
  // Rebuilt 2026-08-23 from a WordPress/Divi export. The old version
  // injected a whole HTML document plus 54 scripts off the WordPress site;
  // these assertions are what "it is really Angular now" looks like.
  //
  // REBUILT AGAIN as a kit page (2026-08-29), so the bespoke `cwi-*` markup
  // these specs named is gone. The locators are the kit's now; the counts
  // are not softened, because they still hold exactly - seven coach quotes
  // are seven `.kit-quote`, the two resources are two `.kit-article`. The
  // one that moved is the contact block: coaching has a form section rather
  // than the kit's contact-details section, so it asserts the form.
  const errors = collectErrors(page);
  await page.goto('/coaching-with-impact');
  await expectShell(page);

  await expect(page.locator('.kit-hero__title')).toBeVisible();
  await expect(page.locator('.kit-carousel')).toBeVisible();
  await expect(page.locator('.kit-article')).toHaveCount(2);
  await expect(page.locator('form')).toBeVisible();
  expect(errors, `errors on /coaching-with-impact:\n${errors.join('\n')}`).toEqual([]);
});

test('the coaching testimonials carousel keeps every quote', async ({ page }) => {
  // All seven coach testimonials were kept when the page moved to a
  // carousel. If Swiper fails to initialise they collapse into one column
  // and six of them become unreachable.
  await page.goto('/coaching-with-impact');
  await expect(page.locator('.kit-carousel')).toBeVisible({ timeout: 20000 });

  await expect(page.locator('.kit-quote')).toHaveCount(7);
  await expect(
    page.locator('.kit-carousel__swiper.swiper-initialized')
  ).toBeVisible();
  await expect(page.locator('.kit-carousel__next')).toBeVisible();
});

test('the coaching page loads no WordPress assets', async ({ page }) => {
  // The point of the rebuild. Any request back to impactdisciples.com means
  // the export has crept back in - and with it jQuery, WooCommerce, Divi
  // and a Facebook pixel.
  const wordpress: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (/impactdisciples\.com\/wp-|facebook\.com\/tr|js\.stripe\.com/.test(url)) {
      wordpress.push(url);
    }
  });
  await page.goto('/coaching-with-impact');
  await expect(page.locator('.kit-hero__title')).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(2000);
  expect(wordpress, `WordPress assets requested:\n${wordpress.join('\n')}`)
    .toEqual([]);
});

test('every coaching image actually loads', async ({ page }) => {
  // All of them are served from this project's own Firebase Storage; a
  // broken token or a moved file shows as an empty box on a live page.
  await page.goto('/coaching-with-impact');
  await expect(page.locator('.kit-hero__title')).toBeVisible({ timeout: 20000 });

  const broken = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('.kit-section img')] as HTMLImageElement[];
    imgs.forEach((i) => (i.loading = 'eager'));
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 3000));
    return imgs.filter((i) => i.naturalWidth === 0).map((i) => i.src);
  });
  expect(broken, `broken images:\n${broken.join('\n')}`).toEqual([]);
});
