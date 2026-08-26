import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

const DISMISSED_KEY = 'library-dock-dismissed';

/** Marks <body> while the dock is on screen, so the global stylesheet can
 *  give the page back the height a fixed bar takes and lift the back-to-top
 *  button clear of it. A body class rather than an unconditional
 *  `body { padding-bottom }` (what the layout/09-docked prototype did),
 *  because this dock can be dismissed and is suppressed on several routes -
 *  a permanent gap under the footer on every page it ISN'T showing on would
 *  be a visible bug. */
const BODY_CLASS = 'has-library-dock';

/** Routes the dock deliberately stays off.
 *
 *  Both its calls to action land on the first two, so showing it there
 *  offers a visitor a trip to the page they are already reading; the last
 *  three are a purchase in progress, which nothing promotional should sit
 *  on top of. 'checkout-success' is listed before 'checkout' only for
 *  readability - the trailing boundary group makes either order correct. */
const SUPPRESSED_ROUTES =
  /^\/(discipleship-library|impact-groups|shopping-cart|checkout-success|checkout)(\/|\?|#|$)/;

/**
 * LIBRARY DOCK - a slim bar pinned to the bottom of every page announcing the
 * Impact Discipleship Library reader app, with one call to action for reading
 * about it and one for finding a group.
 *
 * The FORM is taken from the `layout/09-docked` prototype's DockComponent (a
 * persistent bottom strip: two-tier text on the left, actions on the right, a
 * dismiss affordance) - not the code, which cannot be reused as-is. That
 * branch styles its dock entirely from a design-system rewrite
 * (`src/styles/_tokens.scss` and friends) that `development` does not have, so
 * everything visual here is built on this app's own theme variables and
 * button conventions instead. Its CONTENT is different too: the prototype's
 * dock carried the cart and the next event and changed with context, where
 * this is one fixed announcement.
 *
 * Dismissal is session-scoped by design (see dismiss()).
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

  private readonly router = inject(Router);
  private readonly ngUnsubscribe = new Subject<void>();
  private dismissed = false;

  ngOnInit(): void {
    this.dismissed = this.readDismissed();
    this.update(this.router.url);

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(e => this.update(e.urlAfterRedirects));
  }

  /** Session-scoped, not permanent: closing it should quiet the bar for the
   *  visit someone is in the middle of, without meaning they never hear
   *  about the Library again on a later visit. */
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
    this.visible = !this.dismissed && !SUPPRESSED_ROUTES.test(url);
    document.body.classList.toggle(BODY_CLASS, this.visible);
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
