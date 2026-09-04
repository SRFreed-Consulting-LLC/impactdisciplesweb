import { findSectionRect } from './page-preview.service';
import { ADMIN_APP_ORIGINS } from '@impact-common/shared/config/firebase-projects';

// The measuring half of the previewer's hover outline: the admin asks where
// a section is and this answers in the page's own pixels. Pure DOM, so a
// root built by hand is enough - no TestBed, no router.
describe('findSectionRect', () => {
  let root: HTMLDivElement;

  const section = (key: string, height: number): HTMLElement => {
    const el = document.createElement('section');
    el.setAttribute('data-section-key', key);
    el.style.cssText = `display:block;height:${height}px;width:600px;`;
    root.appendChild(el);
    return el;
  };

  beforeEach(() => {
    root = document.createElement('div');
    root.style.cssText = 'position:absolute;top:0;left:0;';
    document.body.appendChild(root);
  });

  afterEach(() => root.remove());

  it('finds the section carrying the key and reports where it is', () => {
    section('hero', 300);
    section('overview', 120);

    const rect = findSectionRect('overview', root);

    expect(rect).not.toBeNull();
    expect(rect!.key).toBe('overview');
    expect(rect!.top).toBe(300);
    expect(rect!.height).toBe(120);
    expect(rect!.width).toBe(600);
  });

  it('answers null for a key that names nothing on the page', () => {
    section('hero', 300);

    expect(findSectionRect('no-such-section', root)).toBeNull();
  });

  it('matches the attribute exactly, not as a selector', () => {
    // A key is a document field. One with characters that mean something in
    // a selector must still be found - and must not find a neighbour.
    section('faq"]', 50);
    section('faq', 80);

    expect(findSectionRect('faq"]', root)!.height).toBe(50);
    expect(findSectionRect('faq', root)!.height).toBe(80);
  });
});

// The origin gate, which is where this feature actually failed. Everything
// above worked perfectly the whole time; messages from the domain staff use
// were being dropped before any of it ran, and the symptom - a preview that
// highlighted nothing and never showed an unsaved edit - pointed nowhere near
// the check that caused it.
describe('ADMIN_APP_ORIGINS as the previewer trusts them', () => {
  const origins = ADMIN_APP_ORIGINS.map((url) => new URL(url).origin);

  it('trusts the custom domain staff actually work from', () => {
    // The bug, pinned. APP_URLS.admin names only the Firebase-assigned hosts,
    // and building the allow-list from it excluded every real staff session.
    expect(origins).toContain('https://admin.impactdisciples.com');
  });

  it('still trusts both Firebase-assigned admin hosts', () => {
    expect(origins).toContain('https://impactdisciples-admin.web.app');
    expect(origins).toContain('https://impactdisciplesdev-admin.web.app');
  });

  it('trusts a local admin, so the previewer works while developing', () => {
    expect(origins).toContain('http://localhost:5200');
    expect(origins).toContain('http://localhost:5201');
  });

  it('trusts no origin outside the admin', () => {
    // An allow-list that admitted the public site would let any page on it
    // post a section into a staff previewer.
    expect(origins).not.toContain('https://impactdisciples.com');
    expect(origins.every((o) => /admin|localhost/.test(o))).toBeTrue();
  });

  it('holds bare origins, since event.origin never carries a path', () => {
    for (const url of ADMIN_APP_ORIGINS) {
      expect(url.endsWith('/')).toBeFalse();
    }
  });
});
