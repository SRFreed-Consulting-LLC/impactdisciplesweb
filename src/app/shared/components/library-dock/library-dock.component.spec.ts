import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { DockBarModel } from '@impact-common/shared/models/domain/dock-bar.model';
import { DockBarService } from 'src/app/common/services/data/dock-bar.service';
import { LibraryDockComponent } from './library-dock.component';

// Since the bar's content became staff-editable, the decision "should this
// be on screen right now" has two halves and both are worth pinning:
//
//  - the CONFIG half - a missing, inactive, message-less or button-less
//    document all mean "no bar", and none of them is an error;
//  - the ROUTE half - the bar stays off cart/checkout, and off whichever
//    pages its own buttons point at. That second rule is now DERIVED from
//    the configured CTAs; it used to be a hardcoded path list, which would
//    silently stop matching the first time someone retargeted a button.
//
// TestBed-as-injector rather than this repo's usual hand-construction: the
// component resolves its dependencies through inject(), which needs an
// injection context. No template is compiled and nothing renders.

describe('LibraryDockComponent', () => {
  let component: LibraryDockComponent;
  let events: Subject<NavigationEnd>;
  let router: { url: string; events: Subject<NavigationEnd> };

  const aConfig = (extra: Partial<DockBarModel> = {}): DockBarModel =>
    ({
      isActive: true,
      label: 'New',
      message: 'The Impact Discipleship Library',
      note: '· free to join',
      cta1: { title: 'See what it does', destination: '/discipleship-library' },
      cta2: { title: 'Join a Group', destination: '/impact-groups' },
      ...extra
    }) as DockBarModel;

  // No default here either, for the same reason start() has none.
  function configure(url: string, config: DockBarModel | undefined): void {
    events = new Subject<NavigationEnd>();
    router = { url, events };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LibraryDockComponent,
        { provide: Router, useValue: router },
        { provide: DockBarService, useValue: { get: () => Promise.resolve(config) } }
      ]
    });
    component = TestBed.inject(LibraryDockComponent);
  }

  function navigateTo(url: string): void {
    router.url = url;
    events.next(new NavigationEnd(1, url, url));
  }

  const flush = () => new Promise<void>(resolve => setTimeout(resolve));
  const hasBodyClass = () => document.body.classList.contains('has-library-dock');

  /** `config` is REQUIRED: with a default, passing undefined explicitly
   *  would re-trigger that default, and the "nothing saved yet" case
   *  could never be exercised at all. */
  async function start(url: string, config: DockBarModel | undefined): Promise<void> {
    configure(url, config);
    component.ngOnInit();
    await flush();
  }

  beforeEach(() => sessionStorage.clear());

  afterEach(() => {
    component?.ngOnDestroy();
    sessionStorage.clear();
  });

  describe('what the config decides', () => {
    it('shows the bar for an active, complete document', async () => {
      await start('/', aConfig());
      expect(component.visible).toBe(true);
      expect(hasBodyClass()).toBe(true);
    });

    it('shows nothing when no document has been saved', async () => {
      await start('/', undefined);
      expect(component.visible).toBe(false);
      expect(hasBodyClass()).toBe(false);
    });

    it('shows nothing when the bar is switched off', async () => {
      await start('/', aConfig({ isActive: false }));
      expect(component.visible).toBe(false);
    });

    it('shows nothing when there is no message', async () => {
      await start('/', aConfig({ message: '' }));
      expect(component.visible).toBe(false);
    });

    it('shows nothing when no button has a title', async () => {
      await start('/', aConfig({ cta1: { title: '', destination: '/x' }, cta2: undefined }));
      expect(component.visible).toBe(false);
    });

    it('renders a single button when only one is configured', async () => {
      await start('/', aConfig({ cta2: undefined }));
      expect(component.visible).toBe(true);
      expect(component.ctas.map(c => c.title)).toEqual(['See what it does']);
    });

    it('renders both buttons in order when two are configured', async () => {
      await start('/', aConfig());
      expect(component.ctas.map(c => c.title)).toEqual(['See what it does', 'Join a Group']);
    });
  });

  describe('where it shows', () => {
    it('stays out of the way of a purchase in progress', async () => {
      for (const url of ['/shopping-cart', '/checkout', '/checkout-success']) {
        await start(url, aConfig());
        expect(component.visible)
          .withContext(`should be hidden on ${url}`)
          .toBe(false);
        component.ngOnDestroy();
      }
    });

    it('stays off the pages its own buttons point at', async () => {
      for (const url of ['/discipleship-library', '/impact-groups']) {
        await start(url, aConfig());
        expect(component.visible)
          .withContext(`should be hidden on ${url}`)
          .toBe(false);
        component.ngOnDestroy();
      }
    });

    it('follows a retargeted button rather than a fixed list', async () => {
      // The old hardcoded rule named the Library paths. Point the buttons
      // somewhere else and the suppression must move with them.
      const retargeted = aConfig({
        cta1: { title: 'Give', destination: '/give' },
        cta2: undefined
      });

      await start('/give', retargeted);
      expect(component.visible).toBe(false);
      component.ngOnDestroy();

      await start('/discipleship-library', retargeted);
      expect(component.visible).toBe(true);
    });

    it('stays off a child of a button target too, not just the exact page', async () => {
      await start('/impact-groups/abc123', aConfig());
      expect(component.visible).toBe(false);
    });

    it('does not confuse a page that merely starts with the same word', async () => {
      await start('/impact-groups-something-else', aConfig());
      expect(component.visible).toBe(true);
    });

    it('ignores the query string on a destination when matching', async () => {
      await start('/store', aConfig({
        cta1: { title: 'Spanish', destination: '/store?category=spanish-resources' },
        cta2: undefined
      }));
      expect(component.visible).toBe(false);
    });

    it('never suppresses itself for an external button', async () => {
      await start('/', aConfig({
        cta1: { title: 'Merch', destination: 'external', url: 'https://example.com' },
        cta2: undefined
      }));
      expect(component.visible).toBe(true);
      expect(component.isExternal(component.ctas[0])).toBe(true);
      expect(component.hrefFor(component.ctas[0])).toBe('https://example.com');
    });

    it('re-evaluates on navigation, in both directions', async () => {
      await start('/', aConfig());
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
    it('hides the bar and remembers it for the session', async () => {
      await start('/', aConfig());

      component.dismiss();

      expect(component.visible).toBe(false);
      expect(hasBodyClass()).toBe(false);
      expect(sessionStorage.getItem('library-dock-dismissed')).toBe('1');
    });

    it('stays dismissed across a navigation', async () => {
      await start('/', aConfig());
      component.dismiss();

      navigateTo('/events');

      expect(component.visible).toBe(false);
    });

    it('starts hidden when the session already dismissed it', async () => {
      sessionStorage.setItem('library-dock-dismissed', '1');
      await start('/', aConfig());
      expect(component.visible).toBe(false);
    });
  });

  describe('teardown', () => {
    it('drops the body class, so no gap is left under the footer', async () => {
      await start('/', aConfig());
      expect(hasBodyClass()).toBe(true);

      component.ngOnDestroy();

      expect(hasBodyClass()).toBe(false);
    });
  });

  describe('when sessionStorage is unavailable', () => {
    it('still shows the bar rather than throwing (Safari private mode)', async () => {
      const getItem = spyOn(Storage.prototype, 'getItem').and.throwError('denied');
      const setItem = spyOn(Storage.prototype, 'setItem').and.throwError('denied');

      configure('/', aConfig());
      expect(() => component.ngOnInit()).not.toThrow();
      await flush();
      expect(component.visible).toBe(true);

      expect(() => component.dismiss()).not.toThrow();
      expect(component.visible).toBe(false);

      getItem.and.callThrough();
      setItem.and.callThrough();
    });
  });
});
