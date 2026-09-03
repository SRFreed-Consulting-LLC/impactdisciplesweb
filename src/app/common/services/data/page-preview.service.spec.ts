import { findSectionRect } from './page-preview.service';

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
