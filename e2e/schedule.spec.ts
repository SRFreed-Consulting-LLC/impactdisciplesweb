import { test, expect, Page } from '@playwright/test';

// The event schedule / breakout-session picker
// (/events/:eventId/registrations/:registrationId).
//
// This is the app's only "my stuff" screen, and its identity is a CAPABILITY
// URL - a registration id in the path, no login. It reads and WRITES through
// get_event_registration / update_my_sessions.
//
// SCOPE LIMIT, deliberate. Only the failure paths are covered here, because
// the happy path cannot be tested safely against ambient dev data:
//
//   - Dev's 500 event-registrations are real people's records, and this page
//     can CHANGE their session picks. A spec clicking through the picker
//     would mutate somebody's actual registration.
//   - No ACTIVE dev event has any agendaItems, so there are no breakout
//     sessions to pick even with a valid id.
//
// Covering the picker properly needs a fixture event carrying breakout
// sessions plus a fixture registration against it - a bigger seeder than the
// popup/groups ones, and worth doing deliberately rather than in passing.
// Until then these specs pin the part that is genuinely reachable: that a
// bad or stale capability URL degrades instead of crashing. Those links go
// out by EMAIL, so a stale one is the most likely way this page is ever hit.

function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

test.describe('event schedule (capability URL)', () => {
  test('an unknown registration id does not crash the page', async ({ page }) => {
    // The realistic case: an emailed link opened months later, for a
    // registration that has since been removed.
    const errors = collectPageErrors(page);
    await page.goto('/events/no-such-event/registrations/no-such-registration');

    await expect(page.locator('app-home-header')).toBeVisible({ timeout: 20000 });
    expect(errors, `uncaught errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('a malformed schedule URL does not crash the page', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto('/events//registrations/');
    // Whatever the router resolves this to - the schedule page or the
    // not-found page - it must render the shell rather than throw.
    await expect(page.locator('app-home-header')).toBeVisible({ timeout: 20000 });
    expect(errors, `uncaught errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('a bad registration id renders no other attendee data', async ({ page }) => {
    // A capability URL is the ONLY thing guarding this page, so a failed
    // lookup must show nothing rather than falling back to some other
    // record. Asserts the page is not rendering a name or email it should
    // not have.
    await page.goto('/events/no-such-event/registrations/no-such-registration');
    await expect(page.locator('app-home-header')).toBeVisible({ timeout: 20000 });

    const body = (await page.locator('body').textContent()) ?? '';
    expect(body, 'a failed lookup must not surface an email address')
      .not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });
});
