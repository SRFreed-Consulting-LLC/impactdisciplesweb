import { firstValueFrom, of } from 'rxjs';
import { EquippingGroupsComponent } from './equipping-groups.component';
import { EquippingGroupsPastorsComponent } from './equipping-groups-pastors/equipping-groups-pastors.component';
import { EquippingGroupsLeadersComponent } from './equipping-groups-leaders/equipping-groups-leaders.component';
import { EquippingGroupsChurchesComponent } from './equipping-groups-churches/equipping-groups-churches.component';
import { EquippingSectionComponent } from './equipping-section/equipping-section.component';
import { PAGE_SECTION_TYPES } from '@impact-common/shared/lists/page_section_types.enum';
import { PageContentBlock, PageContentItem } from '@impact-common/shared/models/domain/page-content.model';

// Characterization suite written BEFORE the equipping-groups TS/SCSS
// deduplication (bucket A, web item 2), and extended when the four pages
// became dispatchers (2026-08-29). All four share one base class and, since
// the section rework, one template - what still differs is the page_content
// document each one reads, which is what the first block below pins.
//
// Hand-constructed with duck-typed deps, never TestBed - house style.
const CLASSES = [
  ['EquippingGroupsComponent', EquippingGroupsComponent, 'equipping-groups'],
  ['EquippingGroupsPastorsComponent', EquippingGroupsPastorsComponent, 'equipping-groups-pastors'],
  ['EquippingGroupsLeadersComponent', EquippingGroupsLeadersComponent, 'equipping-groups-leaders'],
  ['EquippingGroupsChurchesComponent', EquippingGroupsChurchesComponent, 'equipping-groups-churches']
] as const;

interface PageLike {
  webConfig: unknown;
  sections$: { subscribe: unknown };
  ngOnInit(): Promise<void>;
}

const build = (
  Cls: unknown,
  configs: unknown[],
  forPage: (slug: string) => unknown,
): PageLike =>
  new (Cls as never as new (...a: unknown[]) => PageLike)(
    {} as never,
    { getAll: () => Promise.resolve(configs) } as never,
    { forPage } as never
  );

describe('equipping-groups pages', () => {
  for (const [name, Cls, slug] of CLASSES) {
    describe(name, () => {
      it('loads the first web-config document on init', async () => {
        // Every one of these pages does webConfigService.getAll() and takes
        // [0] - the app treats `web_config` as a singleton collection. The
        // same idiom appears at 14 sites app-wide; consolidating THAT is a
        // separate item, so this pins the current behaviour rather than
        // changing it.
        const configs = [{ id: 'cfg-1' }, { id: 'cfg-2' }];
        const component = build(Cls, configs, () => of(null));

        await component.ngOnInit();

        expect(component.webConfig).toBe(configs[0] as never);
      });

      it('reads its OWN page_content document', async () => {
        // The one thing that still distinguishes these four classes. They
        // share a base, a template and a section renderer; if a slug were
        // ever copy-pasted wrong, two audiences would silently show the same
        // marketing copy and nothing else in the suite would notice.
        const asked: string[] = [];
        const component = build(Cls, [], (s: string) => {
          asked.push(s);
          return of(null);
        });

        await component.ngOnInit();

        expect(asked).toEqual([slug]);
      });

      it('drops switched-off sections and keeps the stored order', async () => {
        const doc = {
          blocks: [
            { key: 'a', type: PAGE_SECTION_TYPES.PAGE_HEADER },
            { key: 'b', type: PAGE_SECTION_TYPES.MISSION, isActive: false },
            { key: 'c', type: PAGE_SECTION_TYPES.COLUMNS, isActive: true }
          ]
        };
        const component = build(Cls, [], () => of(doc));

        await component.ngOnInit();
        const sections = await firstValueFrom(
          component.sections$ as never as import('rxjs').Observable<PageContentBlock[]>
        );

        expect(sections.map((s) => s.key)).toEqual(['a', 'c']);
      });
    });
  }
});

describe('EquippingSectionComponent', () => {
  const item = (over: Partial<PageContentItem>): PageContentItem =>
    ({ title: '', isActive: true, ...over });

  const section = (block: Partial<PageContentBlock>, webConfig: unknown = null) => {
    const c = new EquippingSectionComponent();
    c.block = { key: 'k', ...block } as PageContentBlock;
    c.webConfig = webConfig as never;
    return c;
  };

  it('splits entries into columns, defaulting an unmarked one to the left', () => {
    // An entry saved before `column` existed, or one a future editor writes
    // without it, belongs somewhere visible rather than nowhere.
    const c = section({
      items: [
        item({ title: 'basics', column: 'left' }),
        item({ title: 'pitch', column: 'right' }),
        item({ title: 'stray' })
      ]
    });

    expect(c.leftItems.map((i) => i.title)).toEqual(['basics', 'stray']);
    expect(c.rightItems.map((i) => i.title)).toEqual(['pitch']);
  });

  it('leaves switched-off entries out of both columns', () => {
    const c = section({
      items: [
        item({ title: 'shown', column: 'left' }),
        item({ title: 'hidden', column: 'left', isActive: false })
      ]
    });

    expect(c.leftItems.map((i) => i.title)).toEqual(['shown']);
  });

  it('resolves a price from Web Config by name', () => {
    const c = section({}, { equippingGroupTotalCost: 795 });

    expect(c.amount(item({ amountKey: 'equippingGroupTotalCost' }))).toBe(795);
  });

  it('returns null rather than a price when it cannot resolve one', () => {
    // The template leaves the whole line out for null. A price line reading
    // "$0" is worse than one that is missing - the first is wrong, the
    // second is obviously incomplete.
    const c = section({}, { equippingGroupTotalCost: 795 });

    expect(c.amount(item({ amountKey: 'noSuchField' }))).toBeNull();
    expect(c.amount(item({}))).toBeNull();
    expect(section({}, null).amount(item({ amountKey: 'equippingGroupTotalCost' }))).toBeNull();
  });
});
