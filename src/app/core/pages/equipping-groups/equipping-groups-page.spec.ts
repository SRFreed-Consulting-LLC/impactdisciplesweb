import { EquippingGroupsComponent } from './equipping-groups.component';
import { EquippingGroupsPastorsComponent } from './equipping-groups-pastors/equipping-groups-pastors.component';
import { EquippingGroupsLeadersComponent } from './equipping-groups-leaders/equipping-groups-leaders.component';
import { EquippingGroupsChurchesComponent } from './equipping-groups-churches/equipping-groups-churches.component';

// Characterization suite written BEFORE the equipping-groups TS/SCSS
// deduplication (bucket A, web item 2). All FOUR of these components have
// byte-identical class bodies - the sweep counted three and missed the
// parent - so they are about to share one base class.
//
// Only the TS and SCSS are being shared. The four TEMPLATES stay exactly
// as they are: they carry genuinely different marketing copy per audience
// (92 / 69 / 60 tags) and unifying them would be a content redesign of
// live public pages, not a refactor.
//
// Hand-constructed with duck-typed deps, never TestBed - house style.
const CLASSES = [
  ['EquippingGroupsComponent', EquippingGroupsComponent],
  ['EquippingGroupsPastorsComponent', EquippingGroupsPastorsComponent],
  ['EquippingGroupsLeadersComponent', EquippingGroupsLeadersComponent],
  ['EquippingGroupsChurchesComponent', EquippingGroupsChurchesComponent]
] as const;

describe('equipping-groups pages', () => {
  for (const [name, Cls] of CLASSES) {
    describe(name, () => {
      it('loads the first web-config document on init', async () => {
        // Every one of these pages does webConfigService.getAll() and takes
        // [0] - the app treats `web_config` as a singleton collection. The
        // same idiom appears at 14 sites app-wide; consolidating THAT is a
        // separate item, so this pins the current behaviour rather than
        // changing it.
        const configs = [{ id: 'cfg-1' }, { id: 'cfg-2' }];
        const component = new (Cls as never as new (...a: unknown[]) => {
          webConfig: unknown; isPlaying: boolean;
          ngOnInit(): Promise<void>; playVideo(): void;
        })(
          {} as never,
          { getAll: () => Promise.resolve(configs) } as never
        );

        await component.ngOnInit();

        expect(component.webConfig).toBe(configs[0] as never);
      });

      it('starts with the video paused and plays on demand', () => {
        const component = new (Cls as never as new (...a: unknown[]) => {
          isPlaying: boolean; playVideo(): void;
        })({} as never, { getAll: () => Promise.resolve([]) } as never);

        expect(component.isPlaying).toBe(false);
        component.playVideo();
        expect(component.isPlaying).toBe(true);
      });
    });
  }
});
