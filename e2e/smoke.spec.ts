import { test, expect, Page } from '@playwright/test';

// Verifies the app-wide dead-code sweep (removed MiniCartComponent,
// TestimonialsComponent, CategoryNamePipe, and ~18 files' worth of unused
// imports -- see git history) didn't break anything at runtime. Each lazy
// route module (see app-routing.module.ts) gets one canary page load: a
// clean console + a rendered header is enough to catch a broken import or a
// module that fails to bootstrap, without needing full per-page assertions.

const routesByModule: { module: string; path: string }[] = [
  { module: 'HomeModule', path: '/' },
  { module: 'EventsFeatureModule', path: '/events' },
  { module: 'TeamFeatureModule', path: '/team' },
  { module: 'StoreFeatureModule', path: '/store' },
  { module: 'ContentFeatureModule', path: '/about-us' },
  { module: 'BlogFeatureModule', path: '/podcasts' },
  // SummitComponent's route requires a :year param (see summit.module.ts);
  // 2026 is the year currently linked from disciple-making-summit-banner.
  { module: 'SummitFeatureModule', path: '/summit/2026' }
];

// "Failed to load resource: ..." is how Chromium reports *any* failed
// network request as a console error, including third-party embeds this app
// doesn't control (e.g. a YouTube video's thumbnail 404ing on a specific
// resolution -- seen on /summit/2026 against real dev data). That's noise
// for this suite's purpose (catching broken imports/bootstrap failures from
// app code), so it's filtered out here; uncaught JS exceptions (`pageerror`)
// and explicit `console.error(...)` calls from application code are not.
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

for (const { module, path } of routesByModule) {
  test(`${module} (${path}) loads with no console errors`, async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto(path);

    // The global site header (HomeHeaderComponent) is eagerly loaded in
    // SharedModule and present on every page -- a reliable "the app actually
    // rendered" signal regardless of which lazy module owns the route.
    await expect(page.locator('app-home-header')).toBeVisible();

    expect(errors, `console/page errors on ${path}:\n${errors.join('\n')}`).toEqual([]);
  });
}

test('header renders with the trimmed HeaderComponent (no dead coach/swiper imports)', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  // /events's page banner uses the reusable app-header component that had
  // its leftover CoachModel/CoachService/Swiper imports removed.
  await page.goto('/events');

  await expect(page.locator('app-header')).toBeVisible();
  expect(errors).toEqual([]);
});

test('shopping cart page loads (now served by the reimagined store/cart/checkout)', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  await page.goto('/shopping-cart');

  await expect(page.locator('app-home-header')).toBeVisible();
  expect(errors).toEqual([]);
});
