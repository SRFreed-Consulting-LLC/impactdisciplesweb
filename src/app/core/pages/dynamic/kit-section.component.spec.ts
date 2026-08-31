import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { YouTubePlayerModule } from '@angular/youtube-player';
import {
  ContentPiece, ContentPieceKind, PageContentBlock
} from '@impact-common/shared/models/domain/page-content.model';
import {
  CONTENT_PIECES, SECTION_ARCHETYPE, SECTION_KIT, SECTION_PRESETS
} from '@impact-common/shared/lists/section_kit';
import { TestimonialService } from 'src/app/common/services/data/testimonial.service';
import { SubscribeFormService } from 'src/app/shared/utils/services/subscribe-form.service';
import { KitSectionComponent } from './kit-section.component';
import { environment } from 'src/environments/environment';

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
 * Archetypes the renderer can draw TODAY - all fourteen since 2026-08-30.
 *
 * Kept as an explicit list rather than derived, so it fails in BOTH
 * directions: an archetype here that draws nothing is a missing `@case`, and
 * one absent from here that DOES draw is a renderer somebody added without
 * saying so. Either way the list stays honest, which a derived one could not.
 * Its unimplemented-stays-silent counterpart below currently iterates an
 * empty set, and STAYS - it is what catches archetype fifteen arriving in the
 * kit without a renderer.
 */
const IMPLEMENTED: readonly SECTION_ARCHETYPE[] = [
  SECTION_ARCHETYPE.HERO_BAND,
  SECTION_ARCHETYPE.COPY_CENTRED,
  SECTION_ARCHETYPE.COPY_MEDIA,
  SECTION_ARCHETYPE.LIST_GRID,
  SECTION_ARCHETYPE.LIST_ROWS,
  SECTION_ARCHETYPE.LIST_ARTICLES,
  SECTION_ARCHETYPE.LIST_COLUMNS,
  SECTION_ARCHETYPE.TIMELINE,
  SECTION_ARCHETYPE.CAROUSEL,
  SECTION_ARCHETYPE.FORM,
  SECTION_ARCHETYPE.CONTACT_DETAILS,
  SECTION_ARCHETYPE.PHOTO_BAND,
  SECTION_ARCHETYPE.SLIDER,
  SECTION_ARCHETYPE.COUNTDOWN,
  // The two that replace the fourteen above (2026-08-31). They are in this
  // list from the day they render, not from the day the last page migrates -
  // the whole value of the list is that it fails the moment a member of the
  // kit draws nothing.
  SECTION_ARCHETYPE.SECTION,
  SECTION_ARCHETYPE.LIST
];

/** A block carrying every field, so no archetype renders empty merely because
 *  the fixture starved it. The point is to isolate "the case is missing" from
 *  "the data was thin". */
function blockFor(archetype: SECTION_ARCHETYPE, variant?: string): PageContentBlock {
  return {
    key: 'k1',
    type: archetype,
    // A LIST draws by its LOOK, and a look is the variant. With none named
    // there is nothing to draw and the coverage check would fail for a reason
    // that is about the fixture rather than the renderer - so the fixture
    // names one. The per-variant check below walks all ten.
    variant: variant ?? (archetype === SECTION_ARCHETYPE.LIST ? 'tiles' : undefined),
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
    formId: 'a-real-form-id',
    signupList: 'newsletter',
    testimonialIds: ['t1'],
    items: [
      { title: 'One', description: 'First', body: '<p>x</p>', icon: 'fas fa-heart', link: '/a', isActive: true },
      { title: 'Two', description: 'Second', body: '<p>y</p>', icon: 'fas fa-church', link: '/b', isActive: true }
    ],
    // A SECTION arranges COLUMNS OF PIECES rather than fields, so the fixture
    // has to carry one or the archetype draws an empty band. Same principle
    // as the fields above: starve nothing, so a silent section means a
    // missing case rather than a thin fixture.
    columns: [{ key: 'c1', pieces: [pieceFor('heading'), pieceFor('text')] }],
    isActive: true
  };
}

/**
 * ONE PIECE carrying every field any kind reads.
 *
 * The same trick as `blockFor`, one level down, and for the same reason: a
 * piece that draws nothing must mean the renderer has no case for that kind,
 * never that the fixture forgot to give it a date or an image.
 */
function pieceFor(kind: ContentPieceKind): ContentPiece {
  return {
    key: `p-${kind}`,
    kind,
    isActive: true,
    text: 'Some words',
    level: 'section',
    html: '<p>A passage of text.</p>',
    image: { url: 'https://example.test/photo.jpg', name: 'photo' } as never,
    videoId: 'abc123',
    buttons: [{ title: 'Primary', link: '/somewhere', isActive: true }],
    formId: 'a-real-form-id',
    signupList: 'newsletter',
    // Far enough ahead that the clock never renders zero, whenever the suite
    // runs. A past date draws NOTHING by design, which would read here as a
    // missing case.
    targetDate: '2099-01-01',
    amountKey: 'inpersonSeminarCost',
    amountSuffix: '/seat'
  };
}

describe('the kit section renderer', () => {
  let fixture: ComponentFixture<KitSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KitSectionComponent],
      imports: [YouTubePlayerModule, FormsModule],
      providers: [
        { provide: TestimonialService, useValue: { getAllByValue: () => Promise.resolve([]) } },
        { provide: SubscribeFormService, useValue: { submit: () => Promise.resolve() } }
      ],
      // app-dynamic-form and app-consulation-banner belong to modules too
      // heavy to drag into a renderer spec; the schema lets them stand as
      // inert elements, which is all a draws-something check needs.
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(KitSectionComponent);
  });

  function render(block: PageContentBlock): HTMLElement {
    fixture.componentInstance.block = block;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  /**
   * Whether the section actually put anything on the page.
   *
   * Child ELEMENTS, not text: `@default {}` leaves only the comment nodes
   * Angular's control flow always writes, so zero elements is exactly "the
   * case is missing" - and FIXED_BAND legitimately renders one element with
   * no text at all (`app-consulation-banner`), which a text check would
   * falsely flag.
   */
  function drawn(el: HTMLElement): boolean {
    return (el.querySelector('.kit-section')?.children.length ?? 0) > 0;
  }

  it('draws something for every archetype it claims to implement', () => {
    const silent = IMPLEMENTED.filter((archetype) => !drawn(render(blockFor(archetype))));

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
        if (!drawn(render(blockFor(def.archetype, variant.key)))) {
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
      .filter((archetype) => drawn(render(blockFor(archetype))));

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
      imports: [YouTubePlayerModule, FormsModule],
      providers: [
        { provide: TestimonialService, useValue: { getAllByValue: () => Promise.resolve([]) } },
        { provide: SubscribeFormService, useValue: { submit: () => Promise.resolve() } }
      ],
      // app-dynamic-form and app-consulation-banner belong to modules too
      // heavy to drag into a renderer spec; the schema lets them stand as
      // inert elements, which is all a draws-something check needs.
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
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

  it('shows a resolved figure for a price tile, never the field name', () => {
    // THE BUG THIS EXISTS FOR. The template printed `amountKey`, so the page
    // read "inpersonSeminarCost" where a price belonged - directly under a
    // comment claiming the page resolved it. Every spec was green; it was
    // caught by looking at the rendered page.
    const block = {
      ...blockFor(SECTION_ARCHETYPE.LIST_GRID, 'price'),
      items: [{ title: 'In person', amountKey: 'inpersonSeminarCost', amountSuffix: '/seat', isActive: true }]
    };
    fixture.componentInstance.block = block;
    fixture.componentInstance.webConfig = { inpersonSeminarCost: 249 } as never;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('$249/seat');
    expect(text)
      .withContext('the Web Config FIELD NAME reached the page instead of its value')
      .not.toContain('inpersonSeminarCost');
  });

  it('draws no price line at all when the figure cannot be resolved', () => {
    // "$0" looks like an answer. A missing price line looks like what it is.
    const block = {
      ...blockFor(SECTION_ARCHETYPE.LIST_GRID, 'price'),
      items: [{ title: 'In person', amountKey: 'noSuchField', isActive: true }]
    };
    fixture.componentInstance.block = block;
    fixture.componentInstance.webConfig = { inpersonSeminarCost: 249 } as never;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.kit-tile__price')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('$0');
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

describe('the behaviours the new archetypes own', () => {
  let fixture: ComponentFixture<KitSectionComponent>;
  let submitted: { list: string; who: { email: string } }[];

  beforeEach(async () => {
    submitted = [];
    await TestBed.configureTestingModule({
      declarations: [KitSectionComponent],
      imports: [YouTubePlayerModule, FormsModule],
      providers: [
        { provide: TestimonialService, useValue: { getAllByValue: () => Promise.resolve([]) } },
        {
          provide: SubscribeFormService,
          useValue: {
            submit: (list: string, who: { email: string }) => {
              submitted.push({ list, who });
              return Promise.resolve();
            }
          }
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(KitSectionComponent);
  });

  it('shows a Form Builder form ONLY when one has been picked', () => {
    // A half-configured section must not draw a broken widget - the words
    // render alone until a form is chosen in the admin.
    fixture.componentInstance.block = blockFor(SECTION_ARCHETYPE.FORM, 'plain');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-dynamic-form'))
      .withContext('a picked form did not render').not.toBeNull();

    fixture.componentInstance.block = { ...blockFor(SECTION_ARCHETYPE.FORM, 'plain'), formId: undefined };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-dynamic-form'))
      .withContext('an UNpicked form rendered a widget anyway').toBeNull();
  });

  it('signs up to the list the SECTION names', async () => {
    fixture.componentInstance.block = { ...blockFor(SECTION_ARCHETYPE.FORM, 'mailingList'), signupList: 'prayer' };
    fixture.componentInstance.signup = { firstName: 'A', lastName: 'B', email: 'a@b.c' };

    await fixture.componentInstance.handleSignup();

    expect(submitted.length).toBe(1);
    expect(submitted[0].list).toBe('prayer');
    expect(submitted[0].who.email).toBe('a@b.c');
    // And the fields clear, so a second visitor at a kiosk does not inherit
    // the first one's details.
    expect(fixture.componentInstance.signup.email).toBe('');
  });

  it('defaults an unset list to the newsletter, never to prayer', async () => {
    // The generic case. Joining the PRAYER team is a commitment someone must
    // choose; the newsletter is the list "sign up" plainly means.
    fixture.componentInstance.block = { ...blockFor(SECTION_ARCHETYPE.FORM, 'mailingList'), signupList: undefined };
    fixture.componentInstance.signup = { firstName: 'A', lastName: 'B', email: 'a@b.c' };

    await fixture.componentInstance.handleSignup();

    expect(submitted[0].list).toBe('newsletter');
  });

  it('splits a two-column section by the STORED column, defaulting left', () => {
    fixture.componentInstance.block = {
      ...blockFor(SECTION_ARCHETYPE.LIST_COLUMNS, 'twoColumn'),
      items: [
        { title: 'Facts', isActive: true, column: 'left' },
        { title: 'Pitch', isActive: true, column: 'right' },
        { title: 'Unassigned', isActive: true }
      ] as never
    };

    expect(fixture.componentInstance.leftItems.map((i) => i.title)).toEqual(['Facts', 'Unassigned']);
    expect(fixture.componentInstance.rightItems.map((i) => i.title)).toEqual(['Pitch']);
  });

  it('counts the numbered rows chip from position, zero-padded', () => {
    expect(fixture.componentInstance.chip(0)).toBe('01');
    expect(fixture.componentInstance.chip(11)).toBe('12');
  });

  it('treats an .mp4 in the image slot as a video, case-insensitively', () => {
    const item = (url: string) => ({ title: 't', isActive: true, image: { url } }) as never;
    expect(fixture.componentInstance.isVideo(item('https://x/clip.MP4?alt=media'))).toBeTrue();
    expect(fixture.componentInstance.isVideo(item('https://x/pic.jpg'))).toBeFalse();
  });

  it('speaks a heading without its markup, on the button a screen reader reads', () => {
    // THE BUG THIS EXISTS FOR. Headings carry <strong> on purpose - it is how
    // the site paints a word yellow - and the play button built its
    // aria-label from that raw string, so screen readers announced
    // "Play WHAT YOU <strong> GET</strong>". Invisible on screen; only the
    // accessibility tree shows it (2026-08-31).
    const c = fixture.componentInstance;
    expect(c.spoken('WHAT YOU <strong> GET</strong>', 'the video')).toBe('WHAT YOU GET');
    expect(c.spoken('Ken &amp; the team', 'the video'))
      .withContext('entities must be spoken as characters, not as source')
      .toBe('Ken & the team');
    expect(c.spoken(undefined, 'the video')).toBe('the video');
    expect(c.spoken('<em></em>', 'the video'))
      .withContext('markup that leaves no words must fall back, not go silent')
      .toBe('the video');

    c.block = {
      key: 'v', type: SECTION_ARCHETYPE.COPY_MEDIA,
      heading: 'WHAT YOU <strong> GET</strong>', videoId: 'abc123'
    } as never;
    fixture.detectChanges();

    const label = (fixture.nativeElement as HTMLElement)
      .querySelector('.kit-video__button')?.getAttribute('aria-label') ?? '';
    expect(label).toBe('Play WHAT YOU GET');
    expect(label).not.toContain('<');
  });

  it('counts toward the date the section carries', () => {
    const c = fixture.componentInstance;
    const inThreeDays = new Date(Date.now() + (3 * 86400 + 3600 + 120 + 5) * 1000);
    c.block = { key: 'c', type: SECTION_ARCHETYPE.COUNTDOWN, targetDate: inThreeDays.toISOString() } as never;
    c.ngOnChanges();

    expect(c.remaining?.days).toBe(3);
    expect(c.remaining?.hours).toBe(1);
    c.ngOnDestroy();
  });

  it('draws NO clock for a missing, unreadable or past date', () => {
    // Zeros read as "it starts now" and a negative count reads as a bug.
    // Both are worse than a band with no clock on it - and the heading and
    // button still render, so a lapsed countdown degrades into a banner.
    const c = fixture.componentInstance;
    for (const targetDate of [undefined, '', 'next Tuesday', '2020-01-01T00:00:00Z']) {
      c.block = { key: 'c', type: SECTION_ARCHETYPE.COUNTDOWN, heading: 'SUMMIT', targetDate } as never;
      c.ngOnChanges();
      expect(c.remaining).withContext(`targetDate: ${targetDate}`).toBeNull();
    }

    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.kit-clock')).toBeNull();
    expect(el.textContent).withContext('the band itself must still draw').toContain('SUMMIT');
    c.ngOnDestroy();
  });

  it('pads the clock so it does not jitter as the digits change', () => {
    expect(fixture.componentInstance.pad(7)).toBe('07');
    expect(fixture.componentInstance.pad(42)).toBe('42');
  });

  it('resolves a named destination to this build\'s address, never stored data', () => {
    // THE BUG THIS EXISTS FOR. Give's three buttons and the Library's two
    // store KEYS ('one', 'reader') - a security decision carried over from
    // the bespoke pages - but the kit bound raw ctaUrl, so all five shipped
    // as href="" and looked identical to working buttons through every
    // visual approval pass (caught 2026-08-30).
    const c = fixture.componentInstance;
    expect(c.href({ link: 'one' })).toBe(environment.oneGiftUrl);
    expect(c.href({ link: 'monthly' })).toBe(environment.monthlyGiftUrl);
    expect(c.href({ link: 'partners' })).toBe(environment.impactPartnersGiftUrl);
    expect(c.href({ ctaUrl: 'reader' })).toBe(environment.readerAppOrigin);
  });

  it('passes an ordinary stored address through untouched', () => {
    const c = fixture.componentInstance;
    expect(c.href({ ctaUrl: '/seminar-form' })).toBe('/seminar-form');
    expect(c.href({ link: 'https://example.com/x' })).toBe('https://example.com/x');
    expect(c.href2({ ctaUrl2: '/lunch-and-learn-form' })).toBe('/lunch-and-learn-form');
  });

  it('draws NO button when a destination cannot be resolved', () => {
    // A dead button looks exactly like a working one - the whole reason the
    // five dead ones survived. Nothing usable = nothing drawn.
    expect(fixture.componentInstance.href({})).toBeNull();

    fixture.componentInstance.block = {
      key: 'grid', type: SECTION_ARCHETYPE.LIST_GRID, variant: 'icon',
      items: [{ title: 'Broken', ctaTitle: 'GO', isActive: true }]
    } as never;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Broken');
    expect(el.querySelector('.kit-tile__cta'))
      .withContext('a button with no resolvable destination reached the page')
      .toBeNull();
  });
});


/**
 * DOES EACH PIECE ACTUALLY DRAW ANYTHING?
 *
 * The successor to the archetype census above, and for the identical reason.
 * Where the kit used to say "this band is a hero" it now says "this column
 * holds a heading, some text and two buttons" - so the unit that can silently
 * go missing is no longer the archetype, it is the PIECE. The template still
 * ends in "@default {}", still deliberately, and a piece kind with no case
 * still vanishes from a live page with every other test green.
 *
 * Three checks, because there are three ways a section can now be built:
 * every PIECE draws, every PRESET the Add menu offers draws, and every LIST
 * LOOK draws. Each has already failed honestly during this work.
 */
describe('the pieces a section is built from', () => {
  let fixture: ComponentFixture<KitSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KitSectionComponent],
      imports: [YouTubePlayerModule, FormsModule],
      providers: [
        { provide: TestimonialService, useValue: { getAllByValue: () => Promise.resolve([]) } },
        { provide: SubscribeFormService, useValue: { submit: () => Promise.resolve() } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(KitSectionComponent);
    // The one figure a price piece NAMES, so it resolves rather than drawing
    // nothing - which is what it correctly does when the name is unknown.
    fixture.componentInstance.webConfig = { inpersonSeminarCost: 249 } as never;
  });

  // The countdown starts an interval. A fixture nobody destroys leaves it
  // ticking for the rest of the run.
  afterEach(() => fixture.destroy());

  /**
   * Set the block the way ANGULAR would.
   *
   * Assigning `.block` on the instance is not the same as binding it: Angular
   * calls ngOnChanges for a TEMPLATE-bound input, and the section does real
   * work there - it starts the clock and reads the testimonials. A spec that
   * only assigns is testing a component that never received its input, and
   * the first thing this check caught was exactly that.
   */
  function setBlock(block: unknown): void {
    fixture.componentInstance.block = block as never;
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
  }

  /** A one-column Section holding exactly the piece under test. */
  function renderPiece(piece: ContentPiece): HTMLElement {
    setBlock({
      key: 'k1',
      type: SECTION_ARCHETYPE.SECTION,
      variant: 'columns',
      columns: [{ key: 'c1', pieces: [piece] }],
      isActive: true
    });
    return fixture.nativeElement as HTMLElement;
  }

  /** Did the COLUMN get anything in it? Checked at the column rather than the
   *  section, because the section's wrapper draws whether or not any piece
   *  inside it did - which is exactly the false pass to avoid. */
  function columnFilled(el: HTMLElement): boolean {
    return (el.querySelector('.kit-col')?.children.length ?? 0) > 0;
  }

  it('draws something for every piece kind the kit offers', () => {
    const silent = CONTENT_PIECES
      .map((def) => def.kind)
      .filter((kind) => !columnFilled(renderPiece(pieceFor(kind as ContentPieceKind))));

    expect(silent)
      .withContext(
        'these piece kinds are offered in the editor but render NOTHING - ' +
        'staff can add them and see an empty section'
      )
      .toEqual([]);
  });

  it('draws something for every preset the Add menu offers', () => {
    const silent: string[] = [];

    for (const preset of SECTION_PRESETS) {
      // Exactly what the Add menu writes, with each piece fattened by the
      // fixture so a thin seed is not mistaken for a missing case.
      setBlock({
        key: 'k1',
        type: SECTION_ARCHETYPE.SECTION,
        variant: 'columns',
        ...preset.seed,
        columns: preset.seed.columns.map((column, ci) => ({
          key: 'c' + ci,
          pieces: column.pieces.map((piece) => ({
            ...pieceFor(piece.kind as ContentPieceKind),
            ...piece,
            key: 'c' + ci + '-' + piece.kind
          }))
        })),
        isActive: true
      });

      const el = fixture.nativeElement as HTMLElement;
      const columns = Array.from(el.querySelectorAll('.kit-col'));
      const empty = columns.length !== preset.seed.columns.length
        || columns.some((column) => column.children.length === 0);

      if (empty) {
        silent.push(preset.key);
      }
    }

    expect(silent)
      .withContext('these presets place a section that draws blank columns')
      .toEqual([]);
  });

  it('draws something for every LIST look', () => {
    const looks = SECTION_KIT
      .find((def) => def.archetype === SECTION_ARCHETYPE.LIST)
      ?.variants.map((variant) => variant.key) ?? [];

    // Ten of them, and the count is asserted so a look added to the kit
    // without a rendering cannot slip through by simply not being iterated.
    expect(looks.length).toBe(10);

    const silent = looks.filter((look) => {
      setBlock(blockFor(SECTION_ARCHETYPE.LIST, look));
      const el = fixture.nativeElement as HTMLElement;
      return (el.querySelector('.kit-section')?.children.length ?? 0) === 0;
    });

    expect(silent)
      .withContext('these List looks are offered but render NOTHING')
      .toEqual([]);
  });

  it('leaves out a piece that has been switched off', () => {
    // Absent counts as live, false does not - the same rule as sections and
    // entries. Getting it backwards would publish work somebody hid.
    setBlock({
      key: 'k1',
      type: SECTION_ARCHETYPE.SECTION,
      variant: 'columns',
      columns: [{
        key: 'c1',
        pieces: [
          { ...pieceFor('text'), key: 'shown', html: '<p>VISIBLE</p>' },
          { ...pieceFor('text'), key: 'hidden', html: '<p>HIDDEN</p>', isActive: false }
        ]
      }],
      isActive: true
    });

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('VISIBLE');
    expect(text).not.toContain('HIDDEN');
  });

  it('never draws a piece button whose destination cannot be resolved', () => {
    // The same rule the five dead donation buttons broke, restated for the
    // new renderer: a button with nothing usable behind it draws nothing at
    // all rather than an anchor that goes nowhere.
    const el = renderPiece({
      ...pieceFor('buttons'),
      buttons: [
        { title: 'Works', link: '/somewhere', isActive: true },
        { title: 'Broken', isActive: true }
      ]
    });

    const labels = Array.from(el.querySelectorAll('.kit-actions a')).map((a) => a.textContent?.trim());
    expect(labels.join(' ')).toContain('Works');
    expect(labels.join(' ')).not.toContain('Broken');
  });

  it('resolves a price piece from Web Config, and draws nothing when it cannot', () => {
    // A figure exists in ONE place. A piece names it; it never carries it.
    const good = renderPiece({ ...pieceFor('price'), amountKey: 'inpersonSeminarCost' });
    expect(good.textContent).toContain('249');

    const bad = renderPiece({ ...pieceFor('price'), amountKey: 'noSuchField' });
    expect(bad.textContent)
      .withContext('an unresolvable figure drew a number anyway, which reads as an answer')
      .not.toContain('$');
  });
});

/**
 * THREE DEFECTS THAT PREDATE THE KIT, found while mapping the list
 * archetypes onto the new List member and fixed on the way past.
 *
 * All three are the same species: markup that LOOKS like it works. A button
 * that goes nowhere, a navigation strip that does not navigate, and a title
 * printed twice all render without error and pass any check that only asks
 * whether the section drew something.
 */
describe('the list defects that predate the kit', () => {
  let fixture: ComponentFixture<KitSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KitSectionComponent],
      imports: [YouTubePlayerModule, FormsModule],
      providers: [
        { provide: TestimonialService, useValue: { getAllByValue: () => Promise.resolve([]) } },
        { provide: SubscribeFormService, useValue: { submit: () => Promise.resolve() } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(KitSectionComponent);
  });

  afterEach(() => fixture.destroy());

  function render(block: unknown): HTMLElement {
    fixture.componentInstance.block = block as never;
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('gives a row with no destination its title but not a link', () => {
    const el = render({
      key: 'rows',
      type: SECTION_ARCHETYPE.LIST_ROWS,
      variant: 'buttonAndText',
      items: [
        { title: 'Goes somewhere', link: '/a', description: 'first', isActive: true },
        { title: 'Goes nowhere', description: 'second', isActive: true }
      ]
    });

    const links = Array.from(el.querySelectorAll('.kit-rows__row a')).map((a) => a.textContent?.trim());
    expect(links).toEqual(['Goes somewhere']);

    // The title is the row's CONTENT. Dropping it would lose information the
    // page is there to carry - it just stops claiming to be clickable.
    expect(el.textContent).toContain('Goes nowhere');
  });

  it('makes every jump-strip item jump to the row it names', () => {
    const el = render({
      key: 'arts',
      type: SECTION_ARCHETYPE.LIST_ARTICLES,
      variant: 'numbered',
      items: [
        { title: 'First thing', description: 'a', isActive: true },
        { title: 'Second thing', description: 'b', isActive: true }
      ]
    });

    const targets = Array.from(el.querySelectorAll('.kit-strip__item'))
      .map((item) => item.getAttribute('href'));

    expect(targets.length)
      .withContext('the strip is announced as navigation but rendered no links')
      .toBe(2);

    // Every fragment must actually land on something, which is the half a
    // spans-into-anchors change is most likely to get wrong.
    for (const target of targets) {
      expect(el.querySelector(`article[id="${(target ?? '').slice(1)}"]`))
        .withContext(`the strip links to ${target}, which is not on the page`)
        .not.toBeNull();
    }
  });

  it('prints a numbered row title once when the row has no heading', () => {
    const el = render({
      key: 'arts',
      type: SECTION_ARCHETYPE.LIST_ARTICLES,
      variant: 'numbered',
      items: [{ title: 'Only Title', description: 'a', isActive: true }]
    });

    const body = el.querySelector('.kit-article__copy')?.textContent ?? '';
    const times = body.split('Only Title').length - 1;
    expect(times)
      .withContext('the chip line and the heading fallback both printed it')
      .toBe(1);
  });

  it('still shows both when a numbered row DOES carry a heading', () => {
    // The fix must not go the other way and swallow the title on the rows
    // that legitimately show a chip line and a separate heading.
    const el = render({
      key: 'arts',
      type: SECTION_ARCHETYPE.LIST_ARTICLES,
      variant: 'numbered',
      items: [{ title: 'The Tag', heading: 'The Heading', description: 'a', isActive: true }]
    });

    const body = el.querySelector('.kit-article__copy')?.textContent ?? '';
    expect(body).toContain('The Tag');
    expect(body).toContain('The Heading');
  });
});

/**
 * THE VIDEO A PIECE OWNS.
 *
 * The shared video template read block.image and block.videoId, which was
 * true for as long as a video could only ever be a whole section's. A video
 * is a PIECE now and carries its own, and the block's are gone by then - so
 * the migrated page drew a poster-less box that played nothing. Shane saw it
 * in the comparison within minutes of the screen existing.
 *
 * It is the exact failure this suite exists for: the section still drew, the
 * piece-coverage check still passed, and no word was missing.
 */
describe('a video that belongs to a piece', () => {
  let fixture: ComponentFixture<KitSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KitSectionComponent],
      imports: [YouTubePlayerModule, FormsModule],
      providers: [
        { provide: TestimonialService, useValue: { getAllByValue: () => Promise.resolve([]) } },
        { provide: SubscribeFormService, useValue: { submit: () => Promise.resolve() } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(KitSectionComponent);
  });

  afterEach(() => fixture.destroy());

  function renderVideoPiece(extra: Record<string, unknown> = {}): HTMLElement {
    fixture.componentInstance.block = {
      key: 'k1',
      type: SECTION_ARCHETYPE.SECTION,
      variant: 'columns',
      // Deliberately EMPTY on the block - which is what the migration
      // produces, and what made the old template draw nothing.
      columns: [{
        key: 'c1',
        pieces: [{
          key: 'v1', kind: 'video', isActive: true,
          videoId: 'PIECE-ID',
          image: { url: 'https://example.test/still.jpg', name: 'still' },
          ...extra
        }]
      }],
      isActive: true
    } as never;
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the piece’s own still, not the section’s', () => {
    const poster = renderVideoPiece().querySelector('.kit-video__poster') as HTMLElement;

    expect(poster)
      .withContext('the video piece drew no poster at all')
      .not.toBeNull();
    expect(poster.style.backgroundImage)
      .withContext('the still was blank - the template read the block, which is empty')
      .toContain('still.jpg');
  });

  it('plays the piece’s own video', () => {
    const el = renderVideoPiece();
    (el.querySelector('.kit-video__button') as HTMLElement).click();
    fixture.detectChanges();

    const player = el.querySelector('youtube-player');
    expect(player)
      .withContext('clicking play produced no player')
      .not.toBeNull();
    expect(fixture.componentInstance.playing).toBe('v1');
  });

  it('starts ONE video when a column holds two', () => {
    // A single boolean meant clicking either play button started both.
    fixture.componentInstance.block = {
      key: 'k1', type: SECTION_ARCHETYPE.SECTION, variant: 'columns',
      columns: [{
        key: 'c1',
        pieces: [
          { key: 'first', kind: 'video', isActive: true, videoId: 'AAA' },
          { key: 'second', kind: 'video', isActive: true, videoId: 'BBB' }
        ]
      }],
      isActive: true
    } as never;
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    (el.querySelectorAll('.kit-video__button')[1] as HTMLElement).click();
    fixture.detectChanges();

    expect(el.querySelectorAll('youtube-player').length)
      .withContext('both videos started from one click')
      .toBe(1);
    expect(el.querySelectorAll('.kit-video__poster').length)
      .withContext('the other video should still be showing its still')
      .toBe(1);
  });

  it('still draws the archetype’s video, which lives on the block', () => {
    // The two old call sites hand the block's own fields to the same
    // template. Parameterising it must not break the sections that have not
    // migrated yet - which is every one of them today.
    fixture.componentInstance.block = {
      key: 'k1', type: SECTION_ARCHETYPE.COPY_MEDIA, variant: 'video',
      heading: 'Watch', videoId: 'BLOCK-ID',
      image: { url: 'https://example.test/block-still.jpg', name: 'still' },
      isActive: true
    } as never;
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();

    const poster = (fixture.nativeElement as HTMLElement)
      .querySelector('.kit-video__poster') as HTMLElement;

    expect(poster.style.backgroundImage).toContain('block-still.jpg');
  });
});
