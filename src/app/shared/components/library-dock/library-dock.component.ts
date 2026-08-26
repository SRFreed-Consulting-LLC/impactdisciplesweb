import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { DockBarCta, DockBarModel } from '@impact-common/shared/models/domain/dock-bar.model';
import { DockBarService } from 'src/app/common/services/data/dock-bar.service';

const DISMISSED_KEY = 'library-dock-dismissed';

/** Marks <body> while the dock is on screen, so the global stylesheet can
 *  give the page back the height a fixed bar takes and lift the back-to-top
 *  button and the home slider's pagination dots clear of it. A body class
 *  rather than an unconditional `body { padding-bottom }`, because this dock
 *  can be dismissed, is suppressed on several routes, and can be switched off
 *  entirely from the admin - a permanent gap under the footer on every page
 *  it ISN'T showing on would be a visible bug. */
const BODY_CLASS = 'has-library-dock';

/** Routes the dock stays off no matter what it has been configured to say:
 *  a purchase in progress, which nothing promotional should sit on top of.
 *
 *  The bar ALSO hides on whichever pages its own buttons point at, but that
 *  set is derived from the configured CTAs rather than hardcoded here - see
 *  suppressedByCta(). It used to be a literal list containing the Library
 *  and Impact Groups paths; once staff can retarget those buttons, a literal
 *  list is a rule that silently stops matching the moment it is edited. */
const CHECKOUT_ROUTES = /^\/(shopping-cart|checkout-success|checkout)(\/|\?|#|$)/;

/** The CTA sentinel meaning "the address is in `url`, not a site path" -
 *  see DockBarModel. An external button never suppresses the bar anywhere,
 *  since it doesn't correspond to a page on this site. */
const EXTERNAL = 'external';

/**
 * DOCKING BAR - a slim strip pinned to the bottom of every page, carrying one
 * announcement and one or two calls to action.
 *
 * Its FORM came from the layout/09-docked prototype (a persistent bottom
 * strip: two-tier text on the left, actions on the right, a dismiss
 * affordance), rebuilt on this app's own theme because that branch styles its
 * dock from a design-system rewrite `development` does not have.
 *
 * Its CONTENT is staff-editable: Content Manager > Docking Bar in the admin
 * app writes `dock_bar/current`, and this renders whatever is there. Nothing
 * about the Library is hardcoded here any more - the bar is a general
 * announcement mechanism that currently happens to announce the Library.
 *
 * Shows nothing at all when the document is missing, inactive, or has no
 * message: every one of those is a legitimate "no bar right now", not an
 * error worth surfacing to a visitor.
 *
 * Sits well below <app-campaign-popup> (z-index 10050) so an active campaign
 * popup always wins rather than the two competing at the bottom of the page.
 */
@Component({
  selector: 'app-library-dock',
  templateUrl: './library-dock.component.html',
  styleUrls: ['./library-dock.component.scss'],
  standalone: false
})
export class LibraryDockComponent implements OnInit, OnDestroy {
  visible = false;
  config?: DockBarModel;

  private readonly router = inject(Router);
  private readonly dockBarService = inject(DockBarService);
  private readonly ngUnsubscribe = new Subject<void>();
  private dismissed = false;

  ngOnInit(): void {
    this.dismissed = this.readDismissed();

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(e => this.update(e.urlAfterRedirects));

    // The config arrives after the first paint, which is the right trade for
    // site furniture: nothing else on the page waits on it, and the bar
    // appearing a moment late is better than blocking the render.
    void this.dockBarService.get().then(config => {
      this.config = config;
      this.update(this.router.url);
    });
  }

  /** The buttons actually rendered - one or two, in order. */
  get ctas(): DockBarCta[] {
    return [this.config?.cta1, this.config?.cta2].filter((c): c is DockBarCta => !!c?.title);
  }

  /** An external CTA needs a plain href; an internal one needs routerLink, so
   *  the template has to know which it is. */
  isExternal(cta: DockBarCta): boolean {
    return cta.destination === EXTERNAL;
  }

  hrefFor(cta: DockBarCta): string {
    return cta.url ?? '';
  }

  /** Session-scoped, not permanent: closing it should quiet the bar for the
   *  visit someone is in the middle of, without meaning they never see the
   *  announcement again on a later visit. */
  dismiss(): void {
    this.dismissed = true;
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Safari private mode throws on any write. Losing the flag only means
      // the bar returns on the next navigation - not worth failing over.
    }
    this.update(this.router.url);
  }

  private update(url: string): void {
    this.visible =
      !this.dismissed &&
      !!this.config?.isActive &&
      !!this.config.message &&
      this.ctas.length > 0 &&
      !CHECKOUT_ROUTES.test(url) &&
      !this.suppressedByCta(url);

    document.body.classList.toggle(BODY_CLASS, this.visible);
  }

  /** Don't offer someone a trip to the page they are already reading. Matches
   *  the CTA's own path and anything below it, so a bar pointing at
   *  /impact-groups also stays off /impact-groups/{id}. */
  private suppressedByCta(url: string): boolean {
    return this.ctas.some(cta => {
      if (this.isExternal(cta) || !cta.destination?.startsWith('/')) {
        return false;
      }
      // A destination can carry a query string (the nav list has
      // '/store?category=spanish-resources'); only the path decides this.
      const path = cta.destination.split(/[?#]/)[0].replace(/\/+$/, '');
      return path.length > 1 && (url === path || url.startsWith(`${path}/`) || url.startsWith(`${path}?`));
    });
  }

  private readDismissed(): boolean {
    try {
      return sessionStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove(BODY_CLASS);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
