import { Route, UrlSegment, UrlSegmentGroup } from '@angular/router';
import { routes } from './app-routing.module';
import { SITE_ROUTES } from '@impact-common/shared/lists/site_routes';

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

/** True when some real lazy route claims this path. The wildcard is excluded
 *  deliberately - it has no `matcher`, and "the 404 page will take it" is the
 *  answer this spec exists to reject. */
function claimedByALazyModule(path: string): boolean {
  const segments = segmentsOf(path);
  return routes.some((route: Route) =>
    !!route.matcher
    && route.matcher(segments, null as unknown as UrlSegmentGroup, route) !== null);
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
    expect(claimedByALazyModule('/this-route-does-not-exist')).toBeFalse();
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
