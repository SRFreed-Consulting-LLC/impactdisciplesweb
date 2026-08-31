import { convertToParamMap } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PageContentModel } from '@impact-common/shared/models/domain/page-content.model';
import { DynamicPageComponent } from './dynamic-page.component';

// Hand-constructed with duck-typed deps, the web suite's house style - this
// class is constructor-injected and nothing here needs a template.
describe('DynamicPageComponent', () => {
  let applied: number;

  const doc = (over: Partial<PageContentModel> = {}): PageContentModel =>
    ({
      id: 'mens-retreat',
      title: 'Mens Retreat',
      blocks: [
        { key: 'hero', type: 'heroBand', isActive: true },
        { key: 'copy', type: 'copyCentred', isActive: false }
      ],
      ...over
    }) as never;

  const build = (page: PageContentModel | null): DynamicPageComponent => {
    applied = 0;
    const c = new DynamicPageComponent(
      { paramMap: of(convertToParamMap({ slug: 'mens-retreat' })) } as never,
      { dao: { streamByDocId: () => of(page ? [page] : []) }, fromFirestore: undefined } as never,
      // The REAL service is inert without ?adminPreview in the address, which
      // a spec cannot set. This stand-in counts the composition instead: if
      // the component stops routing its stream through apply(), the
      // previewer silently loses narrowing and as-you-type - and this stays
      // green unless it actually counts.
      { apply: (doc$: Observable<PageContentModel | null>) => { applied++; return doc$; } } as never,
      { getAll: () => Promise.resolve([]) } as never,
      { setTitle: () => undefined } as never
    );
    return c;
  };

  const settled = async (c: DynamicPageComponent) => {
    void c.ngOnInit();
    return firstValueFrom(c.state$.pipe(filter((s) => s.status !== 'loading')));
  };

  it('routes its stream through the previewer service', async () => {
    const c = build(doc());
    await settled(c);

    expect(applied).toBe(1);
  });

  it('hides an unpublished page from a visitor', async () => {
    const c = build(doc({ isPublished: false }));
    c.previewing = false;

    expect((await settled(c)).status).toBe('missing');
  });

  it('shows an unpublished page to the PREVIEWER - the page being built', async () => {
    // The bug this exists for: a draft page previewed as "Page Not Found",
    // so building a page meant watching the absence of your work.
    const c = build(doc({ isPublished: false }));
    c.previewing = true;

    expect((await settled(c)).status).toBe('ready');
  });

  it('draws switched-off sections in the previewer, and not for a visitor', async () => {
    const visitor = build(doc());
    visitor.previewing = false;
    const visitorState = await settled(visitor);

    const preview = build(doc());
    preview.previewing = true;
    const previewState = await settled(preview);

    const keys = (s: { status: string }) =>
      s.status === 'ready'
        ? (s as unknown as { view: { sections: { key: string }[] } }).view.sections.map((b) => b.key)
        : [];
    expect(keys(visitorState)).toEqual(['hero']);
    expect(keys(previewState)).toEqual(['hero', 'copy']);
  });

  it('still 404s a slug with no document, previewer or not', async () => {
    const c = build(null);
    c.previewing = true;

    expect((await settled(c)).status).toBe('missing');
  });
});
