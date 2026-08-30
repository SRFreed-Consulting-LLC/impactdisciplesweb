import { toFooterView } from './site-footer.service';
import { SiteFooter } from '@impact-common/shared/models/domain/site-footer.model';
import SEED from '@impact-common/shared/data/site-footer-seed.json';

// The footer moved from hardcoded markup into Firestore on 2026-08-30. This
// is the proof that the move was faithful: the SEEDED footer - the same file
// the admin's seed script writes, imported from the shared submodule rather
// than copied - converts to exactly what footer.component.html used to render
// with its content baked in.
//
// Everything asserted below was read out of the old template, not invented.
// A copy of the expectations would agree with itself forever, which is why
// the seed is imported rather than restated.

describe('the public footer, as it stands today', () => {
  const view = toFooterView(SEED as SiteFooter);

  it('keeps the masthead and the two links under it', () => {
    expect(view.brandTitle).toBe('Impact Discipleship Ministries');
    expect(view.brandLinks.map((l) => `${l.title} -> ${l.href}`))
      .toEqual(['Give -> /give', 'Join the Prayer Team -> /prayer-team']);
  });

  it('keeps the rights line exactly as it reads on the site', () => {
    // Including the year and the wording. It says 2024 and "All Right
    // reserved."; both are somebody's decision to change now that they can,
    // and neither is this change's business to correct silently.
    expect(view.attribution).toBe('@2024 Ken Adams All Right reserved.');
  });

  it('keeps the three columns, in order, with their headings', () => {
    expect(view.columns.map((c) => c.heading)).toEqual([
      'Information', 'Training', 'Free Resources'
    ]);
  });

  it('sends every column link where it went before', () => {
    const outline: string[] = [];
    for (const column of view.columns) {
      for (const link of column.links) {
        outline.push(`${column.heading} > ${link.title} -> ${link.href}`);
      }
    }
    expect(outline).toEqual([
      'Information > Events -> /events',
      'Information > Shop -> /store',
      'Information > Meet the Team -> /team',
      'Information > About Us -> /about-us',
      'Information > Privacy Policy -> /private-policy',
      'Information > Terms & Condition -> /terms',
      'Training > Upcoming Training -> /events',
      'Training > Seminars -> /seminars',
      'Training > Equipping Groups -> /equipping-groups',
      'Training > Coaching with Impact -> /coaching-with-impact',
      'Training > Lunch and Learns -> /lunch-and-learns',
      'Free Resources > E-Books -> /e-books',
      'Free Resources > Podcasts -> /podcasts',
      'Free Resources > Disciple-Making Minute -> /disciple-making-minute'
    ]);
  });

  it('keeps the newsletter wording and the bottom bar', () => {
    expect(view.newsletterHeading).toBe('newsletter');
    expect(view.newsletterBlurb).toContain('Join over 1,000 people');
    expect(view.bottomText).toContain('SRFreedConsulting');
    expect(view.bottomLinkLabel).toBe('contact');
    expect(view.bottomLinkUrl).toBe('mailto:shane.freed@srfreedconsulting.com');
  });

  it('keeps the background image', () => {
    expect(view.backgroundImage).toContain('footer.PNG');
  });

  it('sends nothing off-site - every footer link today is internal', () => {
    const external = [...view.brandLinks, ...view.columns.flatMap((c) => c.links)]
      .filter((link) => link.external);
    expect(external).toEqual([]);
  });
});

describe('what a visitor actually sees', () => {
  const base = SEED as SiteFooter;

  it('drops a switched-off link', () => {
    const edited: SiteFooter = JSON.parse(JSON.stringify(base));
    edited.columns[0].links[0].visible = false;

    const first = toFooterView(edited).columns[0];
    expect(first.links.map((l) => l.title)).not.toContain('Events');
    expect(first.links.length).toBe(base.columns[0].links.length - 1);
  });

  it('drops a switched-off column', () => {
    const edited: SiteFooter = JSON.parse(JSON.stringify(base));
    edited.columns[1].visible = false;

    expect(toFooterView(edited).columns.map((c) => c.heading))
      .toEqual(['Information', 'Free Resources']);
  });

  it('drops a column left with no visible links, rather than an empty heading', () => {
    const edited: SiteFooter = JSON.parse(JSON.stringify(base));
    for (const link of edited.columns[2].links) {
      link.visible = false;
    }

    expect(toFooterView(edited).columns.map((c) => c.heading))
      .toEqual(['Information', 'Training']);
  });

  it('marks an off-site link so the template can open it in a new tab', () => {
    const edited: SiteFooter = JSON.parse(JSON.stringify(base));
    edited.columns[0].links.push({
      id: 'x', title: 'Merch', kind: 'custom',
      url: 'https://example.test', external: true, visible: true
    });

    const merch = toFooterView(edited).columns[0].links.find((l) => l.title === 'Merch');
    expect(merch?.external).toBeTrue();
    expect(merch?.href).toBe('https://example.test');
  });

  it('leaves the stored footer untouched, so the editor still shows what is off', () => {
    const edited: SiteFooter = JSON.parse(JSON.stringify(base));
    edited.columns[0].visible = false;
    toFooterView(edited);

    expect(edited.columns[0].visible).toBeFalse();
    expect(edited.columns.length).toBe(3);
  });
});
