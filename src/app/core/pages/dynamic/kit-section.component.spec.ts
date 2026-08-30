import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { SECTION_ARCHETYPE, SECTION_KIT } from '@impact-common/shared/lists/section_kit';
import { KitSectionComponent } from './kit-section.component';

/**
 * DOES EACH ARCHETYPE ACTUALLY DRAW ANYTHING?
 *
 * The template ends in `@default {}` - an archetype it does not recognise
 * renders NOTHING, deliberately, because the data outlives the build. That is
 * right in production and dangerous here: forget a `@case` and the section
 * vanishes from a live page with every other test still green. It is the
 * exact failure mode the render census flagged, and this is the check for it.
 *
 * TESTBED WITH A RENDERED TEMPLATE, against this repo's house style of
 * hand-constructing components. It is the sanctioned exception: the TEMPLATE
 * is what is under test, and a class-only spec cannot see an empty section at
 * all. Nothing else here needs it.
 *
 * IT DOES NOT CHECK THAT ANYTHING LOOKS RIGHT. Non-empty output is a very low
 * bar - it catches a missing case, not a broken layout. Comparing a kit
 * rendering against the bespoke one it would replace is separate work, and
 * until that exists this spec is not permission to delete anything.
 */

/**
 * Archetypes the renderer can draw TODAY - five of the fourteen, the ones a
 * new page cannot be built without.
 *
 * Kept as an explicit list rather than derived, so it fails in BOTH
 * directions: an archetype here that draws nothing is a missing `@case`, and
 * one absent from here that DOES draw is a renderer somebody added without
 * saying so. Either way the list stays honest, which a derived one could not.
 */
const IMPLEMENTED: readonly SECTION_ARCHETYPE[] = [
  SECTION_ARCHETYPE.HERO_BAND,
  SECTION_ARCHETYPE.COPY_CENTRED,
  SECTION_ARCHETYPE.COPY_MEDIA,
  SECTION_ARCHETYPE.LIST_GRID,
  SECTION_ARCHETYPE.PHOTO_BAND
];

/** A block carrying every field, so no archetype renders empty merely because
 *  the fixture starved it. The point is to isolate "the case is missing" from
 *  "the data was thin". */
function blockFor(archetype: SECTION_ARCHETYPE, variant?: string): PageContentBlock {
  return {
    key: 'k1',
    type: archetype,
    variant,
    heading: 'A heading',
    subheading: 'An eyebrow',
    body: '<p>A passage of copy.</p>',
    note: 'A small line',
    image: { url: 'https://example.test/photo.jpg', name: 'photo' } as never,
    ctaTitle: 'Primary',
    ctaUrl: '/somewhere',
    ctaTitle2: 'Secondary',
    ctaUrl2: '/elsewhere',
    videoId: 'abc123',
    items: [
      { title: 'One', description: 'First', body: '<p>x</p>', icon: 'fas fa-heart', link: '/a', isActive: true },
      { title: 'Two', description: 'Second', body: '<p>y</p>', icon: 'fas fa-church', link: '/b', isActive: true }
    ],
    isActive: true
  };
}

describe('the kit section renderer', () => {
  let fixture: ComponentFixture<KitSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KitSectionComponent],
      imports: [YouTubePlayerModule]
    }).compileComponents();

    fixture = TestBed.createComponent(KitSectionComponent);
  });

  function render(block: PageContentBlock): HTMLElement {
    fixture.componentInstance.block = block;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  /** What the section actually put on the page, ignoring the wrapper the
   *  template always emits. An empty wrapper IS the failure. */
  function drawnText(el: HTMLElement): string {
    return (el.querySelector('.kit-section')?.textContent ?? '').trim();
  }

  it('draws something for every archetype it claims to implement', () => {
    const silent = IMPLEMENTED.filter((archetype) => !drawnText(render(blockFor(archetype))));

    expect(silent)
      .withContext(
        'These archetypes produced NO output. The template ends in `@default {}`, so a '
        + 'missing or misspelled @case renders nothing and says nothing - on a live page '
        + 'that is a section that silently disappeared.')
      .toEqual([]);
  });

  it('draws something for every VARIANT of the archetypes it implements', () => {
    // A variant is a real branch in the template. Adding one to the kit
    // without a branch here is the same silent failure, one level down.
    const silent: string[] = [];
    for (const def of SECTION_KIT) {
      if (!IMPLEMENTED.includes(def.archetype)) {
        continue;
      }
      for (const variant of def.variants) {
        if (!drawnText(render(blockFor(def.archetype, variant.key)))) {
          silent.push(`${def.archetype}/${variant.key}`);
        }
      }
    }

    expect(silent).toEqual([]);
  });

  it('draws NOTHING for an archetype not yet implemented, and the list says which', () => {
    // The other direction. Without this, adding a renderer and forgetting to
    // update IMPLEMENTED would leave the list quietly wrong, and the
    // assertion above would be testing less than it claims.
    const unexpected = Object.values(SECTION_ARCHETYPE)
      .filter((archetype) => !IMPLEMENTED.includes(archetype))
      .filter((archetype) => !!drawnText(render(blockFor(archetype))));

    expect(unexpected)
      .withContext('These now draw something but are not listed in IMPLEMENTED - add them.')
      .toEqual([]);
  });

  it('names only real archetypes as implemented', () => {
    const known = new Set<string>(Object.values(SECTION_ARCHETYPE));
    expect(IMPLEMENTED.filter((a) => !known.has(a))).toEqual([]);
  });
});

describe('the two axes a section is drawn on', () => {
  let fixture: ComponentFixture<KitSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KitSectionComponent],
      imports: [YouTubePlayerModule]
    }).compileComponents();
    fixture = TestBed.createComponent(KitSectionComponent);
  });

  function renderWith(block: PageContentBlock, theme?: { surface: 'light' | 'dark' | 'tinted' | 'photo' }): HTMLElement {
    fixture.componentInstance.block = block;
    if (theme) {
      fixture.componentInstance.theme = theme;
    }
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.kit-section') as HTMLElement;
  }

  it('takes the page theme when the section does not say', () => {
    // Every colour in the stylesheet hangs off this one class. If it stopped
    // being applied, the section would render on the default ground on every
    // page and nothing else would notice.
    const el = renderWith(blockFor(SECTION_ARCHETYPE.COPY_CENTRED), { surface: 'dark' });
    expect(el.classList).toContain('kit--dark');
  });

  it('lets a section override its page', () => {
    // About Us runs a dark band between light columns - the reason a surface
    // lives on the section at all.
    const block = { ...blockFor(SECTION_ARCHETYPE.COPY_CENTRED), surface: 'tinted' as const };
    expect(renderWith(block, { surface: 'light' }).classList).toContain('kit--tinted');
  });

  it('paints the block image only on a photo surface', () => {
    // On every other surface the image is CONTENT - a picture beside the
    // copy, a tile's photograph. Painting it behind the words as well would
    // show it twice.
    const photo = { ...blockFor(SECTION_ARCHETYPE.PHOTO_BAND), surface: 'photo' as const };
    expect(renderWith(photo).style.backgroundImage).toContain('example.test');

    const light = { ...blockFor(SECTION_ARCHETYPE.COPY_MEDIA), surface: 'light' as const };
    expect(renderWith(light).style.backgroundImage).toBe('');
  });

  it('alternates the media side by position, without storing it', () => {
    // A stored side is a second source of truth that reordering breaks. The
    // rule is the same one About Us's story columns already follow.
    fixture.componentInstance.block = blockFor(SECTION_ARCHETYPE.COPY_MEDIA, 'image');

    fixture.componentInstance.typeIndex = 0;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.kit-split--mediaLeft')).toBeNull();

    fixture.componentInstance.typeIndex = 1;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.kit-split--mediaLeft')).not.toBeNull();
  });

  it('honours a variant that fixes the media side, whatever the position', () => {
    // The split hero always puts its screenshot on the right; alternating it
    // would flip the page's opening layout depending on nothing visible.
    fixture.componentInstance.block = blockFor(SECTION_ARCHETYPE.COPY_MEDIA, 'video');
    fixture.componentInstance.typeIndex = 1;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.kit-split--mediaLeft')).toBeNull();
  });
});
