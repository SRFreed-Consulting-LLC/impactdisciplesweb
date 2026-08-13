import { NgModule } from '@angular/core';
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
function firstSegmentMatcher(allowedFirstSegments: string[]) {
  return (segments: UrlSegment[]) => {
    if (segments.length === 0) return null;
    return allowedFirstSegments.includes(segments[0].path) ? { consumed: [] } : null;
  };
}

const routes: Routes = [
  {
    matcher: (segments: UrlSegment[]) => segments.length === 0 ? { consumed: [] } : null,
    loadChildren: () => import('./core/home.module').then(m => m.HomeModule)
  },
  {
    matcher: firstSegmentMatcher(['events', 'event-details']),
    loadChildren: () => import('./core/events.module').then(m => m.EventsFeatureModule)
  },
  {
    matcher: firstSegmentMatcher(['team', 'team-details']),
    loadChildren: () => import('./core/team.module').then(m => m.TeamFeatureModule)
  },
  // The reimagined store/cart/checkout (originally built and run side by
  // side with the old implementation for comparison -- see the plan doc,
  // "Reimagine Store / Cart / Checkout") now serves these canonical paths
  // directly; the old store-feature.module.ts it replaced is deleted.
  {
    matcher: firstSegmentMatcher(['store', 'spanish-resources', 'product-details', 'shopping-cart', 'checkout', 'checkout-success', 'e-books']),
    loadChildren: () => import('./core/store/store-feature.module').then(m => m.StoreFeatureModule)
  },
  {
    matcher: firstSegmentMatcher([
      'about-us', 'contact', 'newsletter', 'give', 'seminars', 'seminar-form',
      'equipping-groups', 'equipping-groups-pastors', 'equipping-groups-leaders', 'equipping-groups-churches',
      'coaching-with-impact', 'lunch-and-learns', 'lunch-and-learn-form',
      'private-policy', 'terms', 'customer-reviews', 'consultation-survey',
      'monthly-newsletter', 'prayer-team'
    ]),
    loadChildren: () => import('./core/content.module').then(m => m.ContentFeatureModule)
  },
  {
    matcher: firstSegmentMatcher(['account']),
    loadChildren: () => import('./core/account.module').then(m => m.AccountFeatureModule)
  },
  {
    matcher: firstSegmentMatcher(['disciple-making-minute', 'podcasts']),
    loadChildren: () => import('./core/blog.module').then(m => m.BlogFeatureModule)
  },
  {
    matcher: firstSegmentMatcher(['summit', 'summit-preview']),
    loadChildren: () => import('./core/summit.module').then(m => m.SummitFeatureModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
