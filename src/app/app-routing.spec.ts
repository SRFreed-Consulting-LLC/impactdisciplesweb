import { Route, UrlSegment, UrlSegmentGroup } from '@angular/router';
import { CLAIMED_FIRST_SEGMENTS, routes } from './app-routing.module';
import { RESERVED_SLUGS, SITE_ROUTES } from '@impact-common/shared/lists/site_routes';

// THE CHECK THAT KEEPS THE ROUTE CATALOGUE HONEST (2026-08-29).
//
// SITE_ROUTES lives in the shared submodule and is what the admin's
// Navigation screen offers as "pages you can put in the menu". It is declared
// by hand, because the admin app cannot read THIS router at runtime - they
// are separate builds.
//
// A hand-declared list of another app's routes rots, and it rots silently:
// rename a first segment in app-routing.module.ts and the admin carries on
// offering a destination that now 404s, with nothing anywhere to say so. That
// is the exact failure the pick-a-page design exists to prevent, so the
// catalogue is only safe to keep by hand as long as this spec exists.
//
// It runs the REAL matchers from the REAL routes array. It is not a copy of
// the segment lists - a copy would agree with itself forever.

/** The router hands a matcher the URL split into segments. '/' is zero
 *  segments, which is what the home matcher tests for. */
function segmentsOf(path: string): UrlSegment[] {
  return path.split('/').filter(Boolean).map((part) => new UrlSegment(part, {}));
}

/**
 * True when some real lazy route claims this path.
 *
 * TWO routes are excluded, for the same reason: they answer "yes" to things
 * nothing was really written for.
 *   - The WILDCARD has no `matcher`, and "the 404 page will take it" is the
 *     answer this spec exists to reject.
 *   - The DYNAMIC-PAGES route claims EVERY single segment, so once it existed
 *     this helper would return true for every one-word path on earth - and
 *     the catalogue assertion below would go on passing after a real route
 *     was deleted. It is found by its `data.dynamicPages` marker rather than
 *     by position, so reordering the array cannot quietly re-break this.
 */
function claimedByALazyModule(path: string): boolean {
  const segments = segmentsOf(path);
  return routes.some((route: Route) =>
    !!route.matcher
    && !route.data?.['dynamicPages']
    && route.matcher(segments, null as unknown as UrlSegmentGroup, route) !== null);
}

/** Whether the dynamic-pages route - and only it - would take this path. */
function claimedByDynamicPages(path: string): boolean {
  const route = routes.find((r: Route) => r.data?.['dynamicPages']);
  return !!route?.matcher
    && route.matcher(segmentsOf(path), null as unknown as UrlSegmentGroup, route) !== null;
}

describe('the shared route catalogue against the real router', () => {
  it('routes every destination the admin offers as a page', () => {
    const dead = SITE_ROUTES
      .filter((route) => !claimedByALazyModule(route.path))
      .map((route) => `${route.key} -> ${route.path}`);

    expect(dead)
      .withContext(
        'These are in SITE_ROUTES, so the admin will offer them in the menu picker, '
        + 'but no lazy route in app-routing.module.ts claims them - a visitor clicking '
        + 'one gets the 404 page. Either fix the path in the submodule catalogue or '
        + 'add the first segment to the right matcher here.')
      .toEqual([]);
  });

  it('routes the home page, which is the one path with no segments at all', () => {
    // Worth its own assertion: '/' splits to an EMPTY segment list, so it is
    // matched by a different rule from every other entry and would be the
    // first thing a naive helper got wrong.
    expect(claimedByALazyModule('/')).toBeTrue();
  });

  it('routes a path with more than one segment', () => {
    // '/summit/2027' is claimed on its FIRST segment only. If the helper ever
    // started requiring a whole-path match, this is what would catch it.
    expect(claimedByALazyModule('/summit/2027')).toBeTrue();
  });

  it('does NOT claim a path nobody routes', () => {
    // The control. Without this, a helper that returned true for everything
    // would pass every other assertion in this file.
    //
    // It used to read '/this-route-does-not-exist'. That stopped being a
    // control on 2026-08-30: the dynamic-pages route claims every single
    // segment, so the helper now excludes it, and the honest control is a
    // path that route would not take either.
    expect(claimedByALazyModule('/this-route-does-not-exist')).toBeFalse();
    expect(claimedByALazyModule('/nobody/routes/this')).toBeFalse();
  });

  it('keeps the wildcard last, so it cannot shadow a real route', () => {
    // Not strictly about the catalogue, but the catalogue's guarantee rests
    // on it: a wildcard moved up the array would swallow every path above
    // and make the first assertion here meaningless.
    const wildcardIndex = routes.findIndex((route) => route.path === '**');
    expect(wildcardIndex).withContext('there is no wildcard route').toBeGreaterThan(-1);
    expect(wildcardIndex).toBe(routes.length - 1);
  });
});

// PAGES STAFF CREATE (2026-08-30).
//
// A page created in the admin becomes a route by existing: one matcher takes
// any single segment nothing else claimed and looks the slug up in
// `page_content`. Two things have to hold for that to be safe, and neither is
// visible from either side on its own.

describe('the dynamic-pages route', () => {
  it('sits second to last, after every hand-written route', () => {
    // The position IS the safety. Anywhere higher and a page called 'store'
    // would shadow the shop; the whole design rests on every real matcher
    // winning first.
    const index = routes.findIndex((route: Route) => route.data?.['dynamicPages']);
    expect(index).withContext('there is no dynamic-pages route').toBeGreaterThan(-1);
    expect(index).toBe(routes.length - 2);
  });

  it('takes a single segment nothing else claimed, so a new page works at all', () => {
    expect(claimedByDynamicPages('/mens-retreat')).toBeTrue();
  });

  it('leaves multi-segment URLs to the wildcard', () => {
    // Staff pages are one segment. Taking '/a/b' would mean rendering a
    // blank page instead of the 404 for every mistyped deep link.
    expect(claimedByDynamicPages('/summit/2027')).toBeFalse();
    expect(claimedByDynamicPages('/')).toBeFalse();
  });
});

describe('the reserved slug list against the real router', () => {
  // RESERVED_SLUGS lives in the shared submodule because the ADMIN is what
  // enforces it, and the admin cannot read this router. Same rot as
  // SITE_ROUTES above, with a nastier failure: a slug that looks free is a
  // page that saves cleanly, appears in the menu, and opens somebody else's
  // screen. Nothing anywhere would report it.

  it('reserves every segment this router claims', () => {
    const unreserved = CLAIMED_FIRST_SEGMENTS.filter((segment) => !RESERVED_SLUGS.includes(segment));

    expect(unreserved)
      .withContext(
        'These first segments are routed here but are NOT in RESERVED_SLUGS, so the admin '
        + 'would let staff create a page with that slug. The page would never be reachable - '
        + 'this router matches it first - and nothing would say so. Add them to '
        + 'RESERVED_SLUGS in the shared catalogue.')
      .toEqual([]);
  });

  it('reserves nothing this router does not claim', () => {
    // The other direction. A stale entry needlessly blocks a name staff
    // could legitimately use, and there is nothing to tell them why.
    const stale = RESERVED_SLUGS.filter((slug) => !CLAIMED_FIRST_SEGMENTS.includes(slug));

    expect(stale)
      .withContext(
        'These are reserved but no route claims them any more - staff are being refused '
        + 'a slug that is actually free.')
      .toEqual([]);
  });
});
