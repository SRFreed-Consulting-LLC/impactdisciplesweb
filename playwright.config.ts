import { defineConfig, devices } from '@playwright/test';

// Verification harness for impactdisciples-web. Tests assume `npm run
// start-local` is already running against a local dev server on port 4200
// (start-local serves against the impactdisciplesdev Firebase project, not
// an emulator -- see src/environments/environment.local.ts -- so specs are
// read-only checks against real dev data, never against production).
// impactdisciples-admin always runs on 5200, see README "Getting started".
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
