import { test, expect, Page } from '@playwright/test';

// The public Impact Group finder (/impact-groups).
//
// Two reasons this suite is worth more than a page-loads smoke check:
//
//  1. It is the ONLY anonymous read path onto discussionGroups.
//     firestore.rules gates every group read behind signedIn(), so the
//     search_impact_groups Cloud Function reads with the Admin SDK and
//     returns a hand-written projection. That projection is a SECURITY
//     BOUNDARY, and the only thing standing behind it is code review. The
//     leak assertions below are the point of this file.
//
//  2. Discovery only. Joining and creating hand off to the reader, so the
//     CTAs must point at the reader origin - a broken handoff strands
//     everyone who wants to join and nothing else would catch it.
//
// FIXTURE REQUIRED. Dev and prod both have zero real groups, so without one
// these would only ever exercise the empty state. Seed from the ADMIN repo:
//
//   node scripts/seed-e2e-groups.js --project=dev --execute
//   ...run this suite...
//   node scripts/seed-e2e-groups.js --project=dev --remove --execute
//
// Absent the fixture every test SKIPS rather than fails - a setup gap is
// not a product regression. The spec itself stays read-only.
//
// Note search_impact_groups caches for 60s, so a freshly seeded fixture can
// take a minute to appear.

const IN_PERSON = 'E2E Fixture Morning Group';
const ONLINE = 'E2E Fixture Evening Online';
const HIDDEN_INVITE_ONLY = 'E2E Fixture Invite Only';
const HIDDEN_CLOSED = 'E2E Fixture Closed Group';

// Seeded into the online group's onlineInfo, which the projection must
// never publish - it is where a real group keeps its meeting link.
const SECRET_LINK = 'E2E-SECRET-LINK';
const SECRET_PASS = 'e2e-secret-pass';
const CREATOR_EMAIL = 'e2e-leader@example.com';

const cards = (page: Page) => page.locator('app-group-card');

// The dev endpoint the finder reads. Asked ONCE in beforeAll rather than
// per test: waiting 20s in each of a dozen tests to discover the same
// missing fixture took the suite from seconds to minutes, which is how a
// suite stops being run at all.
const SEARCH_URL =
  'https://us-central1-impactdisciplesdev.cloudfunctions.net/search_impact_groups';

let fixturePresent = false;

test.beforeAll(async ({ request }) => {
  try {
    const res = await request.get(SEARCH_URL, { timeout: 20000 });
    fixturePresent = res.ok() && (await res.text()).includes(IN_PERSON);
  } catch {
    fixturePresent = false;
  }
});

/** Skips immediately when the fixtures are not in dev. */
function requireFixture() {
  test.skip(
    !fixturePresent,
    'No Impact Group fixtures in dev - seed them with ' +
      'scripts/seed-e2e-groups.js in the admin repo (allow 60s for the ' +
      'function cache).'
  );
}

test.describe('Impact Groups finder', () => {
  test('lists the open, public groups', async ({ page }) => {
    await page.goto('/impact-groups');
    requireFixture();

    await expect(cards(page).filter({ hasText: IN_PERSON })).toHaveCount(1);
    await expect(cards(page).filter({ hasText: ONLINE })).toHaveCount(1);
    await expect(page.locator('.group-finder__count')).toContainText('open group');
  });

  test('never shows an invite-only or a closed group', async ({ page }) => {
    // Invite-only is only a CLIENT-SIDE filter in the reader; for anonymous
    // traffic this endpoint is the first place it is a real boundary. A
    // closed group keeps its document but must leave the browse list.
    await page.goto('/impact-groups');
    requireFixture();

    await expect(page.getByText(HIDDEN_INVITE_ONLY)).toHaveCount(0);
    await expect(page.getByText(HIDDEN_CLOSED)).toHaveCount(0);
  });

  test('never publishes the meeting link, passcode or leader email', async ({ page }) => {
    // The assertion this file exists for. onlineInfo is free text that in
    // practice holds a joining link and password; creatorEmail is PII.
    // Checked against the whole document, so it catches a leak anywhere -
    // a card, a data attribute, or an inlined payload.
    await page.goto('/impact-groups');
    requireFixture();

    const html = await page.content();
    expect(html, 'meeting link must never reach the public page')
      .not.toContain(SECRET_LINK);
    expect(html, 'passcode must never reach the public page')
      .not.toContain(SECRET_PASS);
    expect(html, 'creator email must never reach the public page')
      .not.toContain(CREATOR_EMAIL);
  });

  test('shows the leader by first name and last initial only', async ({ page }) => {
    // A public, indexable page should not tie a full name to a meeting
    // place and time.
    await page.goto('/impact-groups');
    requireFixture();

    const card = cards(page).filter({ hasText: IN_PERSON });
    await expect(card.locator('.group-card__leader')).toHaveText('Led by Casey F.');
  });

  test('renders capacity, and says so when a group is uncapped', async ({ page }) => {
    // maxMembers excludes the creator while memberCount includes them, so
    // the fixture's 12-cap with 10 members is 3 spots - an off-by-one here
    // would advertise the wrong number of places.
    await page.goto('/impact-groups');
    requireFixture();

    await expect(cards(page).filter({ hasText: IN_PERSON }))
      .toContainText('3 spots left');
    await expect(cards(page).filter({ hasText: ONLINE }))
      .toContainText('Open to new members');
  });

  test('distinguishes in-person from online', async ({ page }) => {
    await page.goto('/impact-groups');
    requireFixture();

    await expect(
      cards(page).filter({ hasText: IN_PERSON }).locator('.group-card__badge')
    ).toHaveText('IN PERSON');
    await expect(cards(page).filter({ hasText: IN_PERSON }))
      .toContainText('Duluth, GA');

    await expect(
      cards(page).filter({ hasText: ONLINE }).locator('.group-card__badge')
    ).toHaveText('ONLINE');
    // An online group says only that it meets online - the joining details
    // are exactly what is withheld, so there is nothing more to show.
    await expect(cards(page).filter({ hasText: ONLINE }))
      .toContainText('Meets online');
  });

  test('the meeting-type filter narrows the list', async ({ page }) => {
    await page.goto('/impact-groups');
    requireFixture();

    await page.getByRole('radio', { name: 'Online' }).check();
    await expect(cards(page).filter({ hasText: ONLINE })).toHaveCount(1);
    await expect(cards(page).filter({ hasText: IN_PERSON })).toHaveCount(0);

    await page.getByRole('radio', { name: 'In person' }).check();
    await expect(cards(page).filter({ hasText: IN_PERSON })).toHaveCount(1);
    await expect(cards(page).filter({ hasText: ONLINE })).toHaveCount(0);
  });

  test('search narrows by city, and clearing it restores the list', async ({ page }) => {
    await page.goto('/impact-groups');
    requireFixture();

    const search = page.getByPlaceholder('City, state or group name');
    await search.fill('Duluth');
    await search.press('Enter');
    await expect(cards(page).filter({ hasText: IN_PERSON })).toHaveCount(1);
    await expect(cards(page).filter({ hasText: ONLINE })).toHaveCount(0);

    // Clearing the box restores everything without needing a submit.
    await search.fill('');
    await expect(cards(page).filter({ hasText: ONLINE })).toHaveCount(1);
  });

  test('a search matching nothing shows the empty state, not a blank page', async ({ page }) => {
    await page.goto('/impact-groups');
    requireFixture();

    const search = page.getByPlaceholder('City, state or group name');
    await search.fill('zzzz-no-such-place');
    await search.press('Enter');

    await expect(cards(page)).toHaveCount(0);
    await expect(page.getByText('No groups match those filters')).toBeVisible();
  });

  test('a group page shows its detail and hands off to the reader', async ({ page }) => {
    await page.goto('/impact-groups');
    requireFixture();
    await cards(page).filter({ hasText: IN_PERSON }).locator('a').first().click();

    await expect(page).toHaveURL(/\/impact-groups\/e2e-group-inperson/);
    await expect(page.locator('.group-detail__title')).toHaveText(IN_PERSON);
    await expect(page.locator('.group-detail__leader')).toHaveText('Led by Casey F.');

    // Joining is the reader's job - this site has no auth, so the CTA must
    // leave it. A broken handoff strands everyone who wants to join.
    const join = page.getByRole('link', { name: /REQUEST TO JOIN/i });
    await expect(join).toBeVisible();
    const href = await join.getAttribute('href');
    expect(href).toContain('/groups/e2e-group-inperson');
    expect(href).toMatch(/^https?:\/\//);
  });

  test('a visible address is shown; the detail page leaks nothing either', async ({ page }) => {
    // Addresses the fixture directly rather than clicking through the list.
    requireFixture();
    await page.goto('/impact-groups/e2e-group-inperson');
    await expect(page.locator('.group-detail__title'))
      .toBeVisible({ timeout: 20000 });

    // This fixture's leader opted to show the address.
    await expect(page.locator('.group-detail__address'))
      .toHaveText('1234 Fixture Street');

    const html = await page.content();
    expect(html).not.toContain(CREATOR_EMAIL);
    expect(html).not.toContain(SECRET_LINK);
  });

  test('an unknown group id shows a real message, not a broken page', async ({ page }) => {
    await page.goto('/impact-groups/no-such-group-at-all');
    await expect(
      page.getByText("We couldn't find that Impact Group")
    ).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByRole('link', { name: /FIND ANOTHER GROUP/i })
    ).toBeVisible();
  });

  test('the finder is reachable from the site nav', async ({ page }) => {
    // A page nothing links to is a page nobody finds.
    await page.goto('/');
    await expect(
      page.locator('a[href="/impact-groups"]').first()
    ).toHaveCount(1);
  });
});
