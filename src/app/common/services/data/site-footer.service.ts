import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, startWith } from 'rxjs';
import { BaseService } from './base.service';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import {
  SITE_FOOTER_COLLECTION,
  SITE_FOOTER_DOC_ID,
  SiteFooter,
  SiteFooterColumn,
  liveFooterColumns
} from '@impact-common/shared/models/domain/site-footer.model';
import { SiteNavItem } from '@impact-common/shared/models/domain/site-navigation.model';
import { siteRoutePath } from '@impact-common/shared/lists/site_routes';
import FALLBACK_FOOTER from '@impact-common/shared/data/site-footer-seed.json';

/** One footer link, resolved to what the template renders. */
export interface FooterLink {
  title: string;
  href: string;
  external: boolean;
}

/** A column of them. */
export interface FooterColumnView {
  heading: string;
  links: FooterLink[];
}

/** Everything the footer template needs, already resolved. */
export interface FooterView {
  brandTitle: string;
  brandLinks: FooterLink[];
  attribution: string;
  columns: FooterColumnView[];
  newsletterHeading: string;
  newsletterBlurb: string;
  bottomText: string;
  bottomLinkLabel: string;
  bottomLinkUrl: string;
  backgroundImage: string;
}

/**
 * THE PUBLIC SITE'S FOOTER, from Firestore (2026-08-30).
 *
 * Every word of it was hardcoded in footer.component.html - fourteen links,
 * four headings and three lines of copyright, each a deploy to change.
 *
 * THE CONTACT BLOCK AND SOCIAL ICONS ARE NOT HERE. They come from
 * `web_config`, which is already editable in the admin. The footer had been
 * rendering a second, hardcoded copy of them
 * (shared/utils/data/impact-disciples.data.ts) that nobody could edit - the
 * real bug in this area - so the footer now reads the config it should
 * always have read. See FooterComponent.
 *
 * A BUNDLED FALLBACK, for the same reason the menu has one: an unreadable or
 * unseeded document must not mean a site with no footer. It falls back to the
 * shipped seed - the same file the admin's seed script writes - so a web
 * build can reach an environment before that environment is seeded.
 */
@Injectable({ providedIn: 'root' })
export class SiteFooterService extends BaseService<SiteFooter> {
  public override table = SITE_FOOTER_COLLECTION;

  /** What the footer renders. Shared, so mounting it on every page opens one
   *  listener rather than one per page. */
  public readonly footer$: Observable<FooterView>;

  constructor(dao: FirebaseDAO<SiteFooter>) {
    super(dao);

    this.footer$ = this.streamById(SITE_FOOTER_DOC_ID).pipe(
      map((docs) => docs[0]),
      // An empty or missing document is treated the same: whatever went
      // wrong, a page with no footer is not the answer.
      map((stored) => toFooterView(stored?.columns?.length ? stored : (FALLBACK_FOOTER as SiteFooter))),
      catchError((err) => {
        console.error('SiteFooterService: falling back to the bundled footer:', err);
        return of(toFooterView(FALLBACK_FOOTER as SiteFooter));
      }),
      startWith(toFooterView(FALLBACK_FOOTER as SiteFooter)),
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }
}

/** Where a footer link points. Identical rules to the top menu's, because it
 *  is the same type against the same catalogue: a page item resolves through
 *  the catalogue rather than storing a URL, so a route that moves is
 *  corrected in one place. */
function hrefFor(link: SiteNavItem): string {
  if (link.kind === 'page') {
    return (link.routeKey && siteRoutePath(link.routeKey)) || '';
  }
  return link.url ?? '';
}

function toLinks(links: SiteNavItem[]): FooterLink[] {
  return (links ?? [])
    .filter((link) => link.visible)
    .map((link) => ({ title: link.title, href: hrefFor(link), external: !!link.external }));
}

export function toFooterView(footer: SiteFooter): FooterView {
  return {
    brandTitle: footer.brandTitle ?? '',
    brandLinks: toLinks(footer.brandLinks ?? []),
    attribution: footer.attribution ?? '',
    columns: liveFooterColumns(footer.columns ?? []).map((column: SiteFooterColumn) => ({
      heading: column.heading,
      links: toLinks(column.links)
    })),
    newsletterHeading: footer.newsletterHeading ?? '',
    newsletterBlurb: footer.newsletterBlurb ?? '',
    bottomText: footer.bottomText ?? '',
    bottomLinkLabel: footer.bottomLinkLabel ?? '',
    bottomLinkUrl: footer.bottomLinkUrl ?? '',
    backgroundImage: footer.backgroundImage ?? ''
  };
}
