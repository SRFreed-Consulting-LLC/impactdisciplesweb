import { NgModule } from '@angular/core';
import { NotFoundComponent } from './core/pages/not-found/not-found.component';
import { RouterModule, Routes, UrlSegment } from '@angular/router';

// Each route group below is lazy-loaded via loadChildren so a visitor only
// downloads the code for the page area they actually visit, instead of the
// whole site's components/DevExtreme forms in one eager bundle.
//
// IMPORTANT: these use a custom `matcher` instead of `path: ''`. Angular's
// router has to actually import() a lazy `loadChildren` module to discover
// its internal routes before it can tell whether they match the URL -- with
// multiple sibling entries all using `path: ''` (this file's original
// version), navigating to a route near the end of this array triggered
// loading *every* module before it too, since the router tries each
// candidate in order until one's (not-yet-known) children match. Confirmed:
// visiting /account was loading the home, events, team, store, and content
// chunks first, silently defeating most of the lazy-loading benefit above.
// A custom UrlMatcher lets the router reject a non-matching entry
// synchronously from the URL's first segment alone, with zero network cost
// -- only the one module that actually owns the requested path ever loads.
function firstSegmentMatcher(allowedFirstSegments: readonly string[]) {
  return (segments: UrlSegment[]) => {
    if (segments.length === 0) return null;
    return allowedFirstSegments.includes(segments[0].path) ? { consumed: [] } : null;
  };
}

// THE SEGMENTS THIS APP CLAIMS, per lazy module.
//
// Pulled out of the matcher calls 2026-08-30 so they can be READ. A page
// staff create becomes a route by existing, and a page created as 'store'
// would never be reachable because the store's matcher runs first - so the
// admin has to refuse those names, which means something has to be able to
// enumerate them. RESERVED_SLUGS in the shared catalogue is that list, and
// app-routing.spec.ts pins it to this one in both directions.
const SEGMENTS = {
  events: ['events', 'event-details'],
  team: ['team', 'team-details'],
  // The reimagined store/cart/checkout (originally built and run side by
  // side with the old implementation for comparison -- see the plan doc,
  // "Reimagine Store / Cart / Checkout") now serves these canonical paths
  // directly; the old store-feature.module.ts it replaced is deleted.
  store: ['store', 'spanish-resources', 'product-details', 'shopping-cart',
    'checkout', 'checkout-success', 'e-books'],
  content: [
    'newsletter', 'seminar-form', 'lunch-and-learn-form',
    'private-policy', 'terms', 'customer-reviews', 'consultation-survey',
    'monthly-newsletter'
  ],
  blog: ['disciple-making-minute', 'podcasts', 'podcasts-v2'],
  // Public Impact Group finder. Named 'impact-groups', not 'groups':
  // /equipping-groups already owns that word in this app's nav and URL space,
  // and the reader/admin apps already say "Impact Groups".
  groups: ['impact-groups'],
  summit: ['summit', 'summit-preview'],
  // The migration comparison: /kit-preview/<slug> draws one of the twelve
  // original pages through the section kit, in memory, without touching its
  // data. Owned by the dynamic-page module; retired with the last migration.
  kitPreview: ['kit-preview']
} as const;

/** Every first segment a hand-written route claims, flat. What a staff-created
 *  page may NOT be called - see RESERVED_SLUGS in the shared catalogue. */
export const CLAIMED_FIRST_SEGMENTS: readonly string[] =
  Object.values(SEGMENTS).flatMap((group) => [...group]);

// Exported for app-routing.spec.ts, which resolves every destination in the
// shared route catalogue (SITE_ROUTES) against these matchers. The admin's
// Navigation screen offers that catalogue as the list of pages you can put in
// the menu, and the admin cannot read this router at runtime - so without a
// check on this side, renaming a first segment here silently turns every menu
// item pointing at it into a 404 nobody is told about.
export const routes: Routes = [
  {
    matcher: (segments: UrlSegment[]) => segments.length === 0 ? { consumed: [] } : null,
    loadChildren: () => import('./core/home.module').then(m => m.HomeModule)
  },
  {
    matcher: firstSegmentMatcher(SEGMENTS.events),
    loadChildren: () => import('./core/events.module').then(m => m.EventsFeatureModule)
  },
  {
    matcher: firstSegmentMatcher(SEGMENTS.team),
    loadChildren: () => import('./core/team.module').then(m => m.TeamFeatureModule)
  },
  // The reimagined store/cart/checkout (originally built and run side by
  // side with the old implementation for comparison -- see the plan doc,
  // "Reimagine Store / Cart / Checkout") now serves these canonical paths
  // directly; the old store-feature.module.ts it replaced is deleted.
  {
    matcher: firstSegmentMatcher(SEGMENTS.store),
    loadChildren: () => import('./core/store/store-feature.module').then(m => m.StoreFeatureModule)
  },
  {
    matcher: firstSegmentMatcher(SEGMENTS.content),
    loadChildren: () => import('./core/content.module').then(m => m.ContentFeatureModule)
  },
  {
    matcher: firstSegmentMatcher(SEGMENTS.blog),
    loadChildren: () => import('./core/blog.module').then(m => m.BlogFeatureModule)
  },
  {
    // Public Impact Group finder. Named 'impact-groups', not 'groups':
    // /equipping-groups already owns that word in this app's nav and URL
    // space, and the reader/admin apps already say "Impact Groups".
    matcher: firstSegmentMatcher(SEGMENTS.groups),
    loadChildren: () => import('./core/groups/groups-feature.module').then(m => m.GroupsFeatureModule)
  },
  {
    matcher: firstSegmentMatcher(SEGMENTS.summit),
    loadChildren: () => import('./core/summit.module').then(m => m.SummitFeatureModule)
  },
  {
    // The kit-preview comparison pages - same lazy module as the dynamic
    // pages, so the kit renderer ships once.
    matcher: firstSegmentMatcher(SEGMENTS.kitPreview),
    loadChildren: () => import('./core/pages/dynamic/dynamic-page.module').then(m => m.DynamicPageModule)
  },
  {
    // PAGES STAFF CREATED. Any SINGLE segment none of the matchers above
    // claimed - the slug is looked up in `page_content` and drawn from the
    // section kit, so creating a page in the admin is all it takes to make
    // one exist.
    //
    // IT MUST STAY SECOND-TO-LAST, and the position is the whole design:
    // every matcher above wins first, so a page created as 'store' or
    // 'give' can never shadow a real route. It also means such a page would
    // silently never be reachable, which is why the admin refuses those
    // slugs on the way in - see RESERVED_SLUGS in the shared catalogue, and
    // the spec below this file that pins the two together.
    //
    // `consumed: []` deliberately: consuming nothing lets the lazy module's
    // own `:slug` route see the segment and name it.
    matcher: (segments: UrlSegment[]) => segments.length === 1 ? { consumed: [] } : null,
    loadChildren: () => import('./core/pages/dynamic/dynamic-page.module').then(m => m.DynamicPageModule),
    // MARKED so app-routing.spec.ts can exclude it. This matcher claims EVERY
    // single segment, so a check asking "does some route claim this path?"
    // would answer yes for everything once it existed - and the catalogue
    // assertion that keeps SITE_ROUTES honest would pass even after a real
    // route was deleted. A marker rather than an index, so reordering the
    // array cannot quietly re-break that.
    data: { dynamicPages: true }
  },
  {
    // Wildcard, and it must stay last: the router takes the first match,
    // so anything below the lazy groups above would shadow them. Before
    // this existed an unknown URL matched nothing at all and rendered a
    // blank page with no header, no footer and no way back.
    //
    // It now only catches MULTI-segment misses ('/a/b'); a single-segment
    // typo is taken by the dynamic-page route above, which renders this
    // same Not Found page itself when the slug resolves to nothing.
    path: '**',
    component: NotFoundComponent,
    title: 'Page Not Found'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
