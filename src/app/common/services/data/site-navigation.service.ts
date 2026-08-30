import { Injectable } from '@angular/core';
import { Observable, map, of, shareReplay, startWith, catchError } from 'rxjs';
import { BaseService } from './base.service';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import {
  liveNavItems,
  SITE_NAVIGATION_COLLECTION,
  SITE_NAVIGATION_DOC_ID,
  SiteNavItem,
  SiteNavigation
} from '@impact-common/shared/models/domain/site-navigation.model';
import { siteRoutePath } from '@impact-common/shared/lists/site_routes';
import { MenuModel } from 'src/app/common/models/utils/nav-menu.model';
import menuData from './nav-menu-data';

/**
 * THE PUBLIC SITE'S TOP MENU, from Firestore (2026-08-29).
 *
 * ONE configuration for both menus. Until now the desktop header and the
 * mobile off-canvas menu each read their own hand-maintained array from
 * nav-menu-data.ts, and those had drifted with nothing asserting either:
 * mobile's Store had no dropdown, so Impact Merchandise could not be reached
 * from a phone at all, and Impact Golf Tournament was missing from mobile
 * entirely. Both components now render the same list, so the two menus cannot
 * disagree again - see nav-menu-data.spec.ts, whose drift assertions were
 * replaced by assertions that they now match.
 *
 * WHY THERE IS STILL A BUNDLED FALLBACK. An unreadable or unseeded
 * navigation document means NO MENU ON ANY PAGE - the worst failure this
 * change could ship, and worse than the empty-page risk page_content already
 * carries. So a missing or empty document falls back to the menu compiled
 * into the bundle rather than to nothing, which also means the web build can
 * ship to an environment before that environment is seeded. The fallback is
 * removed in a later commit, once every environment is confirmed seeded.
 *
 * `menuItems$` emits the FALLBACK FIRST and then the stored menu, so the
 * header draws immediately on a cold load instead of flashing empty while
 * Firestore answers.
 */
@Injectable({ providedIn: 'root' })
export class SiteNavigationService extends BaseService<SiteNavigation> {
  public override table = SITE_NAVIGATION_COLLECTION;

  /** What the header and the mobile menu render. Shared, so the two
   *  components do not open two listeners on the same document. */
  public readonly menuItems$: Observable<MenuModel[]>;

  constructor(dao: FirebaseDAO<SiteNavigation>) {
    super(dao);

    this.menuItems$ = this.streamById(SITE_NAVIGATION_DOC_ID).pipe(
      map((docs) => docs[0]?.items ?? []),
      // An empty document is treated exactly like a missing one: whatever
      // went wrong, a site with no navigation is not the answer.
      map((items) => (items.length ? toMenuModels(items) : FALLBACK_MENU)),
      // streamByDocId already logs and falls back to [] on a Firestore error,
      // so this is belt and braces for a throw in the mapping above - which
      // would otherwise kill the stream and leave the header permanently
      // empty rather than merely stale.
      catchError((err) => {
        console.error('SiteNavigationService: falling back to the bundled menu:', err);
        return of(FALLBACK_MENU);
      }),
      startWith(FALLBACK_MENU),
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }
}

/** The menu compiled into the bundle - what the site rendered before the
 *  document existed, and what it renders if the document ever cannot be
 *  read. Deliberately the DESKTOP array: it is the complete one. */
const FALLBACK_MENU: MenuModel[] = menuData;

/**
 * Converts stored navigation into the shape both templates already render.
 *
 * Keeping MenuModel as the rendering shape rather than rewriting the
 * templates around SiteNavItem is deliberate: it lets the characterization
 * tests written before this change assert that the converted menu is
 * IDENTICAL to the one the site rendered from the hardcoded array. A
 * simultaneous change of data source and template would have had nothing to
 * check itself against.
 *
 * Switched-off items are dropped here, so neither template has to know about
 * visibility - and a dropdown whose children are all switched off drops with
 * them, rather than opening onto nothing.
 */
export function toMenuModels(items: SiteNavItem[]): MenuModel[] {
  return liveNavItems(items).map((item) => {
    const children = item.children ?? [];
    const model: MenuModel = {
      title: item.title,
      // `visible` is always true by this point - liveNavItems has already
      // dropped the rest - but the templates still read it, so it is set
      // rather than left undefined.
      visible: true,
      external: !!item.external,
      highlight: !!item.highlight,
      hasDropdown: item.kind === 'group'
    };

    if (item.kind === 'group') {
      model.dropdownItems = children.map((child) => ({
        link: hrefFor(child),
        title: child.title,
        visible: true,
        external: !!child.external,
        highlight: !!child.highlight
      }));
    } else {
      model.link = hrefFor(item);
    }

    return model;
  });
}

/** Where a menu item actually points. A page item resolves through the shared
 *  route catalogue rather than storing a URL, so a route that moves is
 *  corrected in one place; an unknown key resolves to '' rather than to a
 *  plausible-looking wrong page. */
function hrefFor(item: SiteNavItem): string {
  if (item.kind === 'page') {
    return (item.routeKey && siteRoutePath(item.routeKey)) || '';
  }
  return item.url ?? '';
}
