import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { LibraryDockComponent } from './library-dock.component';

// The dock is almost entirely one decision - should this bar be on screen
// right now - so that decision is what these pin: the routes it stays off,
// that dismissing it sticks for the session, and that <body> only carries
// the spacing class while the bar is actually up (a stale class leaves a
// dead gap under the footer).
//
// TestBed-as-injector rather than this repo's usual hand-construction: the
// component resolves Router through inject(), which needs an injection
// context. No template is compiled and nothing renders - TestBed is doing
// nothing here but handing over one stubbed dependency.

describe('LibraryDockComponent', () => {
  let component: LibraryDockComponent;
  let events: Subject<NavigationEnd>;
  let router: { url: string; events: Subject<NavigationEnd> };

  function configure(url: string): void {
    events = new Subject<NavigationEnd>();
    router = { url, events };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [LibraryDockComponent, { provide: Router, useValue: router }]
    });
    component = TestBed.inject(LibraryDockComponent);
  }

  function navigateTo(url: string): void {
    router.url = url;
    events.next(new NavigationEnd(1, url, url));
  }

  const hasBodyClass = () => document.body.classList.contains('has-library-dock');

  beforeEach(() => sessionStorage.clear());

  afterEach(() => {
    component?.ngOnDestroy();
    sessionStorage.clear();
  });

  describe('where it shows', () => {
    it('is visible on an ordinary page', () => {
      configure('/');
      component.ngOnInit();
      expect(component.visible).toBe(true);
      expect(hasBodyClass()).toBe(true);
    });

    it('stays off the two pages its own buttons point at', () => {
      for (const url of ['/discipleship-library', '/impact-groups']) {
        configure(url);
        component.ngOnInit();
        expect(component.visible)
          .withContext(`should be hidden on ${url}`)
          .toBe(false);
        component.ngOnDestroy();
      }
    });

    it('stays off a single group page too, not just the finder', () => {
      configure('/impact-groups/abc123');
      component.ngOnInit();
      expect(component.visible).toBe(false);
    });

    it('stays out of the way of a purchase in progress', () => {
      for (const url of ['/shopping-cart', '/checkout', '/checkout-success']) {
        configure(url);
        component.ngOnInit();
        expect(component.visible)
          .withContext(`should be hidden on ${url}`)
          .toBe(false);
        component.ngOnDestroy();
      }
    });

    it('does not confuse a page that merely starts with a suppressed word', () => {
      configure('/impact-groups-something-else');
      component.ngOnInit();
      expect(component.visible).toBe(true);
    });

    it('re-evaluates on navigation, in both directions', () => {
      configure('/');
      component.ngOnInit();
      expect(component.visible).toBe(true);

      navigateTo('/checkout');
      expect(component.visible).toBe(false);
      expect(hasBodyClass()).toBe(false);

      navigateTo('/events');
      expect(component.visible).toBe(true);
      expect(hasBodyClass()).toBe(true);
    });
  });

  describe('dismissal', () => {
    it('hides the bar and remembers it for the session', () => {
      configure('/');
      component.ngOnInit();

      component.dismiss();

      expect(component.visible).toBe(false);
      expect(hasBodyClass()).toBe(false);
      expect(sessionStorage.getItem('library-dock-dismissed')).toBe('1');
    });

    it('stays dismissed across a navigation', () => {
      configure('/');
      component.ngOnInit();
      component.dismiss();

      navigateTo('/events');

      expect(component.visible).toBe(false);
    });

    it('starts hidden when the session already dismissed it', () => {
      sessionStorage.setItem('library-dock-dismissed', '1');
      configure('/');
      component.ngOnInit();
      expect(component.visible).toBe(false);
    });
  });

  describe('teardown', () => {
    it('drops the body class, so no gap is left under the footer', () => {
      configure('/');
      component.ngOnInit();
      expect(hasBodyClass()).toBe(true);

      component.ngOnDestroy();

      expect(hasBodyClass()).toBe(false);
    });
  });

  describe('when sessionStorage is unavailable', () => {
    it('still shows the bar rather than throwing (Safari private mode)', () => {
      const getItem = spyOn(Storage.prototype, 'getItem').and.throwError('denied');
      const setItem = spyOn(Storage.prototype, 'setItem').and.throwError('denied');

      configure('/');
      expect(() => component.ngOnInit()).not.toThrow();
      expect(component.visible).toBe(true);

      expect(() => component.dismiss()).not.toThrow();
      expect(component.visible).toBe(false);

      getItem.and.callThrough();
      setItem.and.callThrough();
    });
  });
});
