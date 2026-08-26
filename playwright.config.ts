import { defineConfig, devices } from '@playwright/test';

// Verification harness for impactdisciples-web. Tests assume `npm run
// start-local` is already running against a local dev server on port 4200
// (start-local serves against the impactdisciplesdev Firebase project, not
// an emulator -- see src/environments/environment.local.ts -- so specs are
// read-only checks against real dev data, never against production).
// Port 4200 is web-on-live-data by RULE (2026-08-26), not by habit: the
// thousands digit is the app and the last digit is the backend - web
// 4200/4201, admin 5200/5201, reader 6200/6201, where x201 is the Firebase
// emulator. That is why baseURL below can name a bare port and be sure what
// answers it; previously `start-emu` also bound 4200, so this suite could
// have been pointed at emulator data without anything looking wrong. See
// APP_URLS in the shared submodule's config/firebase-projects.ts.
// `webServer` is deliberately left unset rather than auto-starting `ng
// serve` here, since a cold Angular dev-server boot plus first-compile can
// take well past a reasonable spec timeout, and this repo's dev server is
// often already running during active development anyway.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    // Arrives with the E2E POPUP FIXTURE already dismissed.
    //
    // campaign_popups renders as a full-screen `.cpopup__overlay`, so with
    // the fixture seeded it intercepts pointer events on every other spec
    // in this suite - 11 of them failed that way on 2026-08-26, which is
    // why the fixture had been getting seeded, used and immediately
    // removed again. That left campaign-popup.spec.ts skipping on every
    // ordinary run. Pre-dismissing it here lets the fixture simply STAY
    // seeded in dev.
    //
    // Scoped to the fixture's own id on purpose (it matches FIXTURE_ID in
    // campaign-popup.spec.ts and scripts/seed-e2e-popup.js in the admin
    // repo): a REAL popup appearing in dev should still block and be
    // noticed, rather than being silently suppressed by the harness.
    //
    // campaign-popup.spec.ts's own visitFresh() clears every
    // campaign-popup key per context, so it still sees a first-time
    // visitor and this does not blind it.
    storageState: 'e2e/support/no-popup-state.json',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
