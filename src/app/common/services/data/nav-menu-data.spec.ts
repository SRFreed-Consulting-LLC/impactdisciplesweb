import menuData from './nav-menu-data';
import { toMenuModels } from './site-navigation.service';
import { SiteNavItem } from '@impact-common/shared/models/domain/site-navigation.model';
// Needs resolveJsonModule + allowSyntheticDefaultImports, both added to
// tsconfig.json for this one import - a JSON module has only a default
// export as far as the bundler is concerned, and the namespace form it would
// otherwise take is rejected. Worth remembering as its own small lesson:
// `ng build` passed through both of those failures, because the app bundle
// never compiles a spec. A green build says nothing about the test target.
import SEED from '@impact-common/shared/data/site-navigation-seed.json';

// CHARACTERIZATION of the public site's top navigation, written 2026-08-29
// BEFORE moving it into Firestore - so the move has something to be measured
// against rather than "it looked right when I clicked around".
//
// Nothing had ever asserted this menu. It is two hand-maintained arrays in a
// TypeScript file, edited by hand and shipped by deploy, and the only way to
// know it was wrong was for a visitor to find a link that was not there.
//
// The desktop list is the one that must survive the move UNCHANGED. The
// mobile list is deliberately pinned in its CURRENTLY BROKEN state (see the
// drift block at the bottom): those assertions are the ones expected to go
// red when a single configuration starts feeding both, and going red is how
// the fix proves itself. Do not "fix" them ahead of the change - change the
// code, then change these.

/** Flattens a menu to `Parent > Child` paths, which is the shape a reader can
 *  actually check against the live site. */
function outline(items: { title: string; dropdownItems?: { title: string }[]; dropdownMenu?: { title: string }[] }[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    const children = item.dropdownItems ?? item.dropdownMenu;
    if (!children?.length) {
      out.push(item.title);
      continue;
    }
    out.push(`${item.title} >`);
    for (const child of children) {
      out.push(`${item.title} > ${child.title}`);
    }
  }
  return out;
}

describe('the public top navigation, as it stands today', () => {
  describe('desktop - this is what must not change', () => {
    it('has exactly these eight top-level items, in this order', () => {
      expect(menuData.map((item) => item.title)).toEqual([
        'Home',
        'Training',
        'Resources',
        'Store',
        'Donate',
        'Team',
        'Summit 2027',
        'Impact Golf Tournament'
      ]);
    });

    it('has exactly these items and children, in this order', () => {
      expect(outline(menuData)).toEqual([
        'Home',
        'Training >',
        'Training > Seminars',
        'Training > Equipping Groups',
        'Training > Find an Impact Group',
        'Training > Coaching with Impact',
        'Training > Lunch and Learns',
        'Training > Upcoming Training',
        'Resources >',
        'Resources > E-Books',
        'Resources > Podcasts',
        'Resources > Disciple-Making Minute',
        'Resources > Monthly Newsletter',
        'Resources > Spanish Resources',
        'Store >',
        'Store > Impact Books',
        'Store > Impact Merchandise',
        'Donate',
        'Team',
        'Summit 2027',
        'Impact Golf Tournament'
      ]);
    });

    it('points every item at the destination it points at today', () => {
      const links: Record<string, string | undefined> = {};
      for (const item of menuData) {
        links[item.title] = item.link;
        for (const child of item.dropdownItems ?? []) {
          links[`${item.title} > ${child.title}`] = child.link;
        }
      }

      expect(links).toEqual({
        'Home': '/',
        'Training': undefined, // a dropdown label, not a link
        'Training > Seminars': '/seminars',
        'Training > Equipping Groups': '/equipping-groups',
        'Training > Find an Impact Group': '/impact-groups',
        'Training > Coaching with Impact': '/coaching-with-impact',
        'Training > Lunch and Learns': '/lunch-and-learns',
        'Training > Upcoming Training': '/events',
        'Resources': undefined,
        'Resources > E-Books': '/e-books',
        'Resources > Podcasts': '/podcasts',
        'Resources > Disciple-Making Minute': '/disciple-making-minute',
        'Resources > Monthly Newsletter': '/monthly-newsletter',
        'Resources > Spanish Resources': '/store?category=spanish-resources',
        'Store': undefined,
        'Store > Impact Books': '/store',
        'Store > Impact Merchandise': 'http://www.asbshops.com/lagrangehub/matthewfrady/impact',
        'Donate': '/give',
        'Team': '/team',
        'Summit 2027': '/summit/2027',
        'Impact Golf Tournament': 'https://events.golfstatus.com/event/2nd-Annual-Impact-Golf-Tournament'
      });
    });

    it('opens exactly two destinations in a new tab - both off-site', () => {
      const external: string[] = [];
      for (const item of menuData) {
        if (item.external) {
          external.push(item.title);
        }
        for (const child of item.dropdownItems ?? []) {
          if (child.external) {
            external.push(`${item.title} > ${child.title}`);
          }
        }
      }
      expect(external).toEqual(['Store > Impact Merchandise', 'Impact Golf Tournament']);
    });

    it('highlights exactly three things', () => {
      const highlighted: string[] = [];
      for (const item of menuData) {
        if (item.highlight) {
          highlighted.push(item.title);
        }
        for (const child of item.dropdownItems ?? []) {
          if (child.highlight) {
            highlighted.push(`${item.title} > ${child.title}`);
          }
        }
      }
      expect(highlighted).toEqual(['Store > Impact Merchandise', 'Summit 2027', 'Impact Golf Tournament']);
    });

    it('shows every item it defines - nothing is switched off', () => {
      // So a later "why is that missing" has one fewer place to hide.
      for (const item of menuData) {
        expect(item.visible).withContext(`${item.title} is hidden`).toBeTrue();
        for (const child of item.dropdownItems ?? []) {
          expect(child.visible).withContext(`${item.title} > ${child.title} is hidden`).toBeTrue();
        }
      }
    });

    it('is never more than two levels deep', () => {
      // The whole reason the editor can cap nesting at two.
      for (const item of menuData) {
        for (const child of item.dropdownItems ?? []) {
          expect(child.dropdownMenu ?? [])
            .withContext(`${item.title} > ${child.title} has a third level`)
            .toEqual([]);
        }
      }
    });
  });

  describe('the seeded menu, converted - this is what now replaces both', () => {
    // WHAT THESE REPLACED, because the change is only legible next to it.
    //
    // Until 2026-08-29 this block asserted a SECOND hand-maintained array,
    // `mobileMenuData`, in its broken state: its Store was a flat link with
    // no dropdown, so Impact Merchandise could not be reached from a phone at
    // all, and Impact Golf Tournament was missing entirely. Those assertions
    // existed to be turned red by the fix, and they were. The array and its
    // model are deleted; both menus render the list below.
    //
    // The seed is imported from the SHARED SUBMODULE - the same file the
    // admin's seed script writes to Firestore. A hand-copied fixture here
    // would agree with itself forever and prove nothing about what was
    // actually seeded.
    const converted = toMenuModels(SEED.items as SiteNavItem[]);

    it('produces the desktop menu, item for item, unchanged', () => {
      // The whole switchover in one assertion: what staff will edit renders
      // as exactly what the site rendered from the hardcoded array.
      expect(outline(converted)).toEqual(outline(menuData));
    });

    it('sends every item to the same destination as before', () => {
      const linksOf = (items: typeof converted) => {
        const links: Record<string, string | undefined> = {};
        for (const item of items) {
          links[item.title] = item.link;
          for (const child of item.dropdownItems ?? []) {
            links[`${item.title} > ${child.title}`] = child.link;
          }
        }
        return links;
      };
      // menuData's dropdown parents have `link: undefined`; the converter
      // omits the key entirely. Same meaning - a dropdown label goes nowhere.
      expect(linksOf(converted)).toEqual(jasmine.objectContaining(
        Object.fromEntries(Object.entries(linksOf(menuData)).filter(([, link]) => link !== undefined))
      ));
    });

    it('keeps the same two off-site links and the same three highlights', () => {
      const flagged = (items: typeof converted, flag: 'external' | 'highlight') => {
        const out: string[] = [];
        for (const item of items) {
          if (item[flag]) out.push(item.title);
          for (const child of item.dropdownItems ?? []) {
            if (child[flag]) out.push(`${item.title} > ${child.title}`);
          }
        }
        return out;
      };
      expect(flagged(converted, 'external')).toEqual(['Store > Impact Merchandise', 'Impact Golf Tournament']);
      expect(flagged(converted, 'highlight')).toEqual([
        'Store > Impact Merchandise', 'Summit 2027', 'Impact Golf Tournament'
      ]);
    });

    it('CLOSES the two holes the mobile menu used to have', () => {
      // Not incidental - this is the reason the change was worth making.
      // Both menus render `converted`, so both of these are now reachable on
      // a phone for the first time.
      const entries = outline(converted);
      expect(entries).toContain('Store > Impact Merchandise');
      expect(entries).toContain('Impact Golf Tournament');
    });

    it('marks the off-site child as external, which the old mobile model could not express', () => {
      // DropdownMenuModel carried only link/title/visible. Adding Impact
      // Merchandise to a mobile dropdown back then would have rendered a
      // [routerLink] pointing at asbshops.com and tried to route to it
      // INSIDE the Angular app. The missing item and the inability to render
      // it were the same omission.
      const merch = converted
        .find((item) => item.title === 'Store')?.dropdownItems
        ?.find((child) => child.title === 'Impact Merchandise');
      expect(merch?.external).toBeTrue();
      expect(merch?.link).toContain('asbshops.com');
    });

    it('drops a switched-off item, and a dropdown left with nothing in it', () => {
      const hidden = toMenuModels([
        { id: 'a', title: 'Donate', kind: 'page', routeKey: 'give', visible: false },
        {
          id: 'b', title: 'Training', kind: 'group', visible: true,
          children: [{ id: 'b1', title: 'Seminars', kind: 'page', routeKey: 'seminars', visible: false }]
        },
        { id: 'c', title: 'Team', kind: 'page', routeKey: 'team', visible: true }
      ]);
      expect(hidden.map((item) => item.title)).toEqual(['Team']);
    });
  });
});
