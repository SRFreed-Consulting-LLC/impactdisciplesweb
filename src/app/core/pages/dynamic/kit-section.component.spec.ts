import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  ContentPiece, ContentPieceKind, PageContentBlock
} from '@impact-common/shared/models/domain/page-content.model';
import {
  CONTENT_PIECES, GRID_LIST_LOOKS, SECTION_ARCHETYPE, SECTION_KIT
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
 * The kit the renderer can draw TODAY - both members of it.
 *
 * FOURTEEN ARCHETYPES were named here until 2026-09-01. The list existed
 * because the template ends in `@default {}`, so a missing case renders
 * nothing and says nothing - and it earned that place, going red honestly
 * four times in the week it covered.
 *
 * It is two lines now, and it still fails in BOTH directions: a member here
 * that draws nothing is a missing case, and one absent from here that DOES
 * draw is a renderer somebody added without saying so.
 */
const IMPLEMENTED: readonly SECTION_ARCHETYPE[] = [
  SECTION_ARCHETYPE.SECTION,
  SECTION_ARCHETYPE.LIST
];

/** A block carrying every field, so no archetype renders empty merely because
 *  the fixture starved it. The point is to isolate "the case is missing" from
 *  "the data was thin". */
/**
 * A STAND-IN FOR <youtube-player>, and the reason is not tidiness.
 *
 * The real one fetches https://www.youtube.com/iframe_api the moment it
 * renders - and the kit passes [disablePlaceholder]="true", which removes
 * the click-to-load placeholder that would otherwise defer it. So every run
 * of this spec made a live cross-origin request to youtube.com, and that
 * made the WHOLE WEB UNIT SUITE intermittently unstable in three ways:
 *
 *   "Script error." with no detail - a browser masks a cross-origin
 *     script's real message, so the failure named nothing;
 *   "An error was thrown in afterAll" - the player kept initialising after
 *     the spec had finished, so the error landed after teardown;
 *   "Disconnected, because no message in 30000 ms" - a slow fetch stalled
 *     the browser past Karma's heartbeat.
 *
 * Reproduced on 2026-09-03 by running this file ALONE three times: two clean
 * passes and one run carrying both the afterAll error and the disconnect.
 * Machine load made it likelier by slowing the fetch, but the network call
 * was the cause, not the load.
 *
 * A real component rather than leaning on CUSTOM_ELEMENTS_SCHEMA, so the
 * bindings stay checked: rename an input in the template and this goes red,
 * which a tolerated unknown element would not.
 */
// The selector has to be exactly 'youtube-player' - it is standing in for a
// third-party element the kit's own template names, so the house "app-"
// prefix rule cannot apply to it. Renaming it would simply mean the stub
// never matches and the real player loads again.
// eslint-disable-next-line @angular-eslint/component-selector
@Component({ selector: 'youtube-player', standalone: true, template: '' })
class YouTubePlayerStub {
  @Input() videoId?: string;
  @Input() playerVars?: unknown;
  @Input() disablePlaceholder?: boolean;
}

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
/**
 * Submit the sign-up form the way a visitor does.
 *
 * Through the DOM on purpose: which mailing list is joined is a field on the
 * PIECE, and the template is the only thing that reads it across. Calling
 * `handleSignup()` on the class passes no list and quietly subscribes
 * everybody to the newsletter - so a spec that calls it directly cannot see
 * a broken binding, and for one afternoon it did not.
 */
async function submitSignup(fixture: ComponentFixture<KitSectionComponent>): Promise<void> {
  fixture.detectChanges();
  const form = (fixture.nativeElement as HTMLElement)
    .querySelector('.kit-signup__form') as HTMLFormElement;
  expect(form).withContext('the sign-up form did not render at all').not.toBeNull();
  form.dispatchEvent(new Event('submit'));
  await fixture.whenStable();
}

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
      imports: [YouTubePlayerStub, FormsModule],
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

  // THE COUNTDOWN STARTS AN INTERVAL, and a fixture nobody destroys leaves
  // it ticking inside the Angular zone for the whole rest of the run. Three
  // of the six describes in this file destroyed their fixture and three did
  // not, which is what made the web suite unreliable: Jasmine randomises
  // spec order, so whichever spec happened to run once the zone was busy
  // enough was the one blamed - a different one every time, each passing on
  // its own. See the note on the same hook further down.
  afterEach(() => fixture.destroy());

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
      imports: [YouTubePlayerStub, FormsModule],
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

  // See the top of this file: an undestroyed fixture leaves the countdown's
  // interval running for the rest of the suite.
  afterEach(() => fixture.destroy());

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
    const el = renderWith(blockFor(SECTION_ARCHETYPE.SECTION), { surface: 'dark' });
    expect(el.classList).toContain('kit--dark');
  });

  it('lets a section override its page', () => {
    // About Us runs a dark band between light columns - the reason a surface
    // lives on the section at all.
    const block = { ...blockFor(SECTION_ARCHETYPE.SECTION), surface: 'tinted' as const };
    expect(renderWith(block, { surface: 'light' }).classList).toContain('kit--tinted');
  });

  it('paints the block image only on a photo surface', () => {
    // On every other surface the image is CONTENT - a picture beside the
    // copy, a tile's photograph. Painting it behind the words as well would
    // show it twice.
    const photo = { ...blockFor(SECTION_ARCHETYPE.SECTION), surface: 'photo' as const };
    expect(renderWith(photo).style.backgroundImage).toContain('example.test');

    const light = { ...blockFor(SECTION_ARCHETYPE.SECTION), surface: 'light' as const };
    expect(renderWith(light).style.backgroundImage).toBe('');
  });

  it('shows a resolved figure for a price tile, never the field name', () => {
    // THE BUG THIS EXISTS FOR. The template printed `amountKey`, so the page
    // read "inpersonSeminarCost" where a price belonged - directly under a
    // comment claiming the page resolved it. Every spec was green; it was
    // caught by looking at the rendered page.
    const block = {
      ...blockFor(SECTION_ARCHETYPE.LIST, 'price'),
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
      ...blockFor(SECTION_ARCHETYPE.LIST, 'price'),
      items: [{ title: 'In person', amountKey: 'noSuchField', isActive: true }]
    };
    fixture.componentInstance.block = block;
    fixture.componentInstance.webConfig = { inpersonSeminarCost: 249 } as never;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.kit-tile__price')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('$0');
  });

  it('gives the wider track to the words, on whichever side the picture sits', () => {
    // COPY_MEDIA alternated its media side by POSITION on the page, because
    // there was nowhere to say which side it wanted. A Section says it by
    // column order, which is what the editor drags - so the rule is now
    // "read the columns", and it must read them rather than count anything.
    const columns = (first: 'picture' | 'text') => [
      { key: 'a', pieces: [{ key: 'a1', kind: first, isActive: true, text: 'Words' }] },
      { key: 'b', pieces: [{ key: 'b1', kind: first === 'picture' ? 'text' : 'picture',
        isActive: true, text: 'Words' }] }
    ];
    const draw = (first: 'picture' | 'text') => {
      fixture.componentInstance.block = {
        key: 'k1', type: SECTION_ARCHETYPE.SECTION, variant: 'columns',
        columns: columns(first), isActive: true
      } as never;
      // typeIndex is deliberately held still. If it ever moves the answer,
      // the stored order has stopped being the truth.
      fixture.componentInstance.typeIndex = 1;
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('.kit-cols--mediaLeft');
    };

    expect(draw('text')).withContext('picture second, so the split is not mediaLeft').toBeNull();
    expect(draw('picture')).withContext('picture first, so it is').not.toBeNull();
  });
});

describe('the behaviours the new archetypes own', () => {
  let fixture: ComponentFixture<KitSectionComponent>;
  let submitted: { list: string; who: { email: string } }[];

  beforeEach(async () => {
    submitted = [];
    await TestBed.configureTestingModule({
      declarations: [KitSectionComponent],
      imports: [YouTubePlayerStub, FormsModule],
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

  // THE WORST OFFENDER of the three that were missing this: the countdown
  // specs live in here, so every run left at least two live intervals
  // behind. See the top of this file.
  afterEach(() => fixture.destroy());

  it('shows a Form Builder form ONLY when one has been picked', () => {
    // A half-configured section must not draw a broken widget - the words
    // render alone until a form is chosen in the admin.
    fixture.componentInstance.block = {
      key: 'k1', type: SECTION_ARCHETYPE.SECTION, variant: 'columns',
      columns: [{ key: 'c1', pieces: [{ key: 'f', kind: 'form', formId: 'a-real-form-id', isActive: true }] }],
      isActive: true
    } as never;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-dynamic-form'))
      .withContext('a picked form did not render').not.toBeNull();

    fixture.componentInstance.block = {
      key: 'k1', type: SECTION_ARCHETYPE.SECTION, variant: 'columns',
      columns: [{ key: 'c1', pieces: [{ key: 'f', kind: 'form', isActive: true }] }],
      isActive: true
    } as never;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-dynamic-form'))
      .withContext('an UNpicked form rendered a widget anyway').toBeNull();
  });

  it('signs up to the list the SECTION names', async () => {
    fixture.componentInstance.block = {
      key: 'k1', type: SECTION_ARCHETYPE.SECTION, variant: 'columns',
      columns: [{ key: 'c1', pieces: [{ key: 's', kind: 'signup', signupList: 'prayer', isActive: true }] }],
      isActive: true
    } as never;
    fixture.componentInstance.signup = { firstName: 'A', lastName: 'B', email: 'a@b.c' };

    // Submitted through the FORM, not by calling the handler. The list is a
    // field on the PIECE now, and the only thing that reads it is the
    // template's `handleSignup(piece.signupList)` - a direct call passes no
    // list at all and so defaults to the newsletter, which is what this test
    // wrongly asserted was correct on 2026-09-01.
    await submitSignup(fixture);

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
    fixture.componentInstance.block = {
      key: 'k1', type: SECTION_ARCHETYPE.SECTION, variant: 'columns',
      columns: [{ key: 'c1', pieces: [{ key: 's', kind: 'signup', isActive: true }] }],
      isActive: true
    } as never;
    fixture.componentInstance.signup = { firstName: 'A', lastName: 'B', email: 'a@b.c' };

    await submitSignup(fixture);

    expect(submitted[0].list).toBe('newsletter');
  });

  // "splits a two-column section by the STORED column" was here until
  // 2026-09-01. It covered LIST_COLUMNS, whose entries each carried a
  // `column` saying which half they belonged to. A Section has real columns
  // now, each holding its own pieces, so there is nothing left to split -
  // the test above ("gives the wider track to the words") covers what
  // replaced it.

  it('counts the numbered rows chip from position, zero-padded', () => {
    expect(fixture.componentInstance.chip(0)).toBe('01');
    expect(fixture.componentInstance.chip(11)).toBe('12');
  });

  it('treats an .mp4 in the image slot as a video, case-insensitively', () => {
    const item = (url: string) => ({ title: 't', isActive: true, image: { url } }) as never;
    expect(fixture.componentInstance.isVideo(item('https://x/clip.MP4?alt=media'))).toBeTrue();
    expect(fixture.componentInstance.isVideo(item('https://x/pic.jpg'))).toBeFalse();
  });

  it('keeps a HIDDEN heading in the markup, and off the screen', () => {
    // WHY THIS EXISTS (2026-09-01). The home page opens on a full-width
    // slider with nowhere to put a visible <h1>, so it had none at all - and
    // that is the heading a search engine reads the page by. "Read, but not
    // shown" is how it has both.
    //
    // The trap this guards is using `display: none` or `visibility: hidden`,
    // either of which would ALSO take the heading out of the accessibility
    // tree - hiding it from the screen reader that is the point of it.
    fixture.componentInstance.block = {
      key: 'k1', type: SECTION_ARCHETYPE.SECTION, variant: 'columns',
      columns: [{ key: 'c1', pieces: [
        { key: 'h', kind: 'heading', level: 'page', text: 'Impact Discipleship Ministries',
          hidden: true, isActive: true }
      ] }],
      isActive: true
    } as never;
    fixture.detectChanges();

    const h1 = (fixture.nativeElement as HTMLElement).querySelector('h1');
    expect(h1).withContext('the heading left the markup entirely').not.toBeNull();
    expect(h1!.textContent).toContain('Impact Discipleship Ministries');
    expect(h1!.classList.contains('kit-sr-only')).toBeTrue();

    const style = getComputedStyle(h1!);
    expect(style.display).withContext('display:none hides it from screen readers too').not.toBe('none');
    expect(style.visibility).withContext('visibility:hidden hides it from screen readers too').not.toBe('hidden');

    // And the yellow rule does not draw under words nobody can see.
    expect((fixture.nativeElement as HTMLElement).querySelector('.kit-rule'))
      .withContext('drew a rule under an invisible heading')
      .toBeNull();

    // AND THE SECTION TAKES NO ROOM. Its wrap carries 80px of vertical
    // padding for the section rhythm; on a section with nothing visible in
    // it that is 160px of empty band - which is the band the hidden heading
    // exists to avoid, reintroduced by its own padding. Home shipped with
    // exactly that gap above its slider for one deploy.
    expect(fixture.componentInstance.onlyHiddenContent).toBeTrue();
    const section = (fixture.nativeElement as HTMLElement).querySelector('section.kit-section');
    expect(section!.classList.contains('kit-section--unseen')).toBeTrue();
  });

  it('draws an ordinary heading normally, rule and all', () => {
    // The other direction, so the test above cannot pass by hiding every
    // heading.
    fixture.componentInstance.block = {
      key: 'k1', type: SECTION_ARCHETYPE.SECTION, variant: 'columns',
      columns: [{ key: 'c1', pieces: [
        { key: 'h', kind: 'heading', level: 'page', text: 'Seminars', isActive: true }
      ] }],
      isActive: true
    } as never;
    fixture.detectChanges();

    const h1 = (fixture.nativeElement as HTMLElement).querySelector('h1');
    expect(h1!.classList.contains('kit-sr-only')).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).querySelector('.kit-rule')).not.toBeNull();
    // And it keeps its band, so the collapse above cannot be collapsing
    // every section.
    expect(fixture.componentInstance.onlyHiddenContent).toBeFalse();
  });

  it('keeps a section that mixes a hidden heading with visible words', () => {
    // The collapse is for a section with NOTHING to show. One that also
    // carries a passage is an ordinary section and keeps its spacing.
    fixture.componentInstance.block = {
      key: 'k1', type: SECTION_ARCHETYPE.SECTION, variant: 'columns',
      columns: [{ key: 'c1', pieces: [
        { key: 'h', kind: 'heading', level: 'page', text: 'Hidden', hidden: true, isActive: true },
        { key: 't', kind: 'text', html: '<p>But this shows.</p>', isActive: true }
      ] }],
      isActive: true
    } as never;
    fixture.detectChanges();

    expect(fixture.componentInstance.onlyHiddenContent)
      .withContext('collapsed a section that has visible words in it')
      .toBeFalse();
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

    // AND THE SAME BUG'S SECOND HALF (2026-09-01). A video was a FIELD on a
    // block that also held the heading, so the button could always find
    // words. As a piece it has only its own caption, which almost no video
    // has - so it must reach the heading piece BESIDE it, or every migrated
    // page announces a bare "Play the video".
    c.block = {
      key: 'v', type: SECTION_ARCHETYPE.SECTION, variant: 'columns',
      columns: [{ key: 'c1', pieces: [
        { key: 'h', kind: 'heading', text: 'WHAT YOU <strong> GET</strong>', isActive: true },
        { key: 'vid', kind: 'video', videoId: 'abc123', isActive: true }
      ] }],
      isActive: true
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
    c.block = { key: 'c', type: SECTION_ARCHETYPE.SECTION, variant: 'columns',
      columns: [{ key: 'c1', pieces: [
        { key: 'clock', kind: 'countdown', targetDate: inThreeDays.toISOString(), isActive: true }
      ] }] } as never;
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
      c.block = { key: 'c', type: SECTION_ARCHETYPE.SECTION, variant: 'columns',
        columns: [{ key: 'c1', pieces: [
          { key: 'h', kind: 'heading', text: 'SUMMIT', isActive: true },
          { key: 'clock', kind: 'countdown', targetDate, isActive: true }
        ] }] } as never;
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
      key: 'grid', type: SECTION_ARCHETYPE.LIST, variant: 'icon',
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
      imports: [YouTubePlayerStub, FormsModule],
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

  // A PRESET-COVERAGE TEST LIVED HERE until the presets were removed
  // (2026-08-31): it placed each of the twelve and asserted the section it
  // seeded actually drew. What it was really protecting - that a column of
  // pieces renders - is covered by the piece-coverage test above, which is
  // the more fundamental of the two and outlived it.
  it('draws something for every LIST look', () => {
    const looks = SECTION_KIT
      .find((def) => def.archetype === SECTION_ARCHETYPE.LIST)
      ?.variants.map((variant) => variant.key) ?? [];

    // Eleven of them, and the count is asserted so a look added to the kit
    // without a rendering cannot slip through by simply not being iterated.
    // It earned that on 2026-09-04: 'quoteCards' was added to the kit and this
    // line failed before the rendering existed, which is the whole point of
    // pinning a number nobody would otherwise think to update.
    expect(looks.length).toBe(11);

    const silent = looks.filter((look) => {
      setBlock(blockFor(SECTION_ARCHETYPE.LIST, look));
      const el = fixture.nativeElement as HTMLElement;
      return (el.querySelector('.kit-section')?.children.length ?? 0) === 0;
    });

    expect(silent)
      .withContext('these List looks are offered but render NOTHING')
      .toEqual([]);
  });

  // QUOTE CARDS. The variant exists for one reason - the order - so that is
  // what these pin. Everything else about it is the picture card it was
  // derived from, and is covered by the coverage test above.
  describe('quote cards', () => {
    const quoteBlock = () => ({
      key: 'k1',
      type: SECTION_ARCHETYPE.LIST,
      variant: 'quoteCards',
      heading: 'Disciple Making Coaches',
      isActive: true,
      items: [{
        key: 'e1',
        isActive: true,
        image: { url: 'https://example.test/coach.jpg', name: 'coach' },
        title: 'Jane Smith',
        description: 'Discipleship changed how I lead my whole church.',
        body: 'Pastor, First Baptist'
      }]
    });

    it('puts the quote ABOVE the name, which is the whole point of it', () => {
      setBlock(quoteBlock());
      const el = fixture.nativeElement as HTMLElement;
      const card = el.querySelector('.kit-quotecard') as HTMLElement;

      expect(card).withContext('no quote card rendered').not.toBeNull();
      const quote = card.querySelector('.kit-quotecard__quote') as HTMLElement;
      const name = card.querySelector('.kit-quotecard__name') as HTMLElement;
      // DOCUMENT_POSITION_FOLLOWING: the name comes after the quote. Asserted
      // on position rather than on CSS, because a card that merely LOOKS
      // right while reading name-first to a screen reader is not this card.
      const order = quote.compareDocumentPosition(name);
      expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('reads as a quote and its source, not a heading and a paragraph', () => {
      setBlock(quoteBlock());
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('figure.kit-quotecard')).not.toBeNull();
      expect(el.querySelector('blockquote.kit-quotecard__quote')).not.toBeNull();
      expect(el.querySelector('figcaption.kit-quotecard__by')).not.toBeNull();
    });

    it('shows the quote, the name and the role', () => {
      setBlock(quoteBlock());
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Discipleship changed how I lead my whole church.');
      expect(text).toContain('Jane Smith');
      expect(text).toContain('Pastor, First Baptist');
    });

    it('leaves the role line out when there is none', () => {
      // It is optional, and an empty line under a name would read as a gap
      // somebody forgot to fill.
      const block = quoteBlock();
      delete (block.items[0] as { body?: string }).body;
      setBlock(block);
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.kit-quotecard__name')).not.toBeNull();
      expect(el.querySelector('.kit-quotecard__role')).toBeNull();
    });

    it('draws no photo frame when an entry has no photo', () => {
      const block = quoteBlock();
      delete (block.items[0] as { image?: unknown }).image;
      setBlock(block);
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.kit-quotecard')).not.toBeNull();
      expect(el.querySelector('.kit-quotecard__img')).toBeNull();
    });
  });
  // CARDS PER ROW. The admin offers this setting only for looks drawn as a
  // grid, reading GRID_LIST_LOOKS from the shared kit; this renderer decides
  // the same thing from its own LIST_LOOKS map. Two codebases, one question -
  // so they are asserted against each other rather than trusted to agree.
  describe('cards per row', () => {
    const gridLooks = () => SECTION_KIT
      .find((def) => def.archetype === SECTION_ARCHETYPE.LIST)!
      .variants.map((v) => v.key)
      .filter((key) => GRID_LIST_LOOKS.includes(key));

    it('every look the admin offers it for really does draw as a grid', () => {
      // Otherwise the control appears and silently does nothing - the exact
      // failure that retired the old copy-colour toggle.
      for (const look of GRID_LIST_LOOKS) {
        setBlock({...blockFor(SECTION_ARCHETYPE.LIST, look), cardsPerRow: 2});
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.kit-grid.kit-cols--2'))
          .withContext(`"${look}" is offered a cards-per-row setting it ignores`)
          .not.toBeNull();
      }
    });

    it('and no grid look is left out of the offer', () => {
      // The other direction: a look that DOES honour the count but is missing
      // from the shared list is a setting staff can never reach.
      const looks = SECTION_KIT
        .find((def) => def.archetype === SECTION_ARCHETYPE.LIST)!
        .variants.map((v) => v.key);
      for (const look of looks) {
        setBlock({...blockFor(SECTION_ARCHETYPE.LIST, look), cardsPerRow: 3});
        const el = fixture.nativeElement as HTMLElement;
        const honoursIt = !!el.querySelector('.kit-cols--3');
        expect(honoursIt)
          .withContext(`"${look}" honours cardsPerRow but is not in GRID_LIST_LOOKS`)
          .toBe(GRID_LIST_LOOKS.includes(look));
      }
    });

    it('draws no count class when the section names none', () => {
      // Absent means "as many as fit", which is the auto-fit the variant
      // already declares - not a count of zero.
      setBlock(blockFor(SECTION_ARCHETYPE.LIST, 'quoteCards'));
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[class*="kit-cols--"]')).toBeNull();
    });

    it('puts quote cards two to a row when asked', () => {
      setBlock({...blockFor(SECTION_ARCHETYPE.LIST, 'quoteCards'), cardsPerRow: 2});
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.kit-grid.kit-cols--2')).not.toBeNull();
    });

    it('gridLooks is not accidentally empty', () => {
      expect(gridLooks().length).toBeGreaterThan(0);
    });
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
      imports: [YouTubePlayerStub, FormsModule],
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
      type: SECTION_ARCHETYPE.LIST,
      variant: 'rows',
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
      type: SECTION_ARCHETYPE.LIST,
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
      type: SECTION_ARCHETYPE.LIST,
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
      type: SECTION_ARCHETYPE.LIST,
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
      imports: [YouTubePlayerStub, FormsModule],
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

  it('draws the poster the PIECE carries, not a bare player', () => {
    // This test read "still draws the archetype's video, which lives on the
    // block" until 2026-09-01, and guarded the parameterised #video template
    // against breaking the sections that had not migrated yet. All of them
    // have. What it really covers is worth keeping: a video piece whose
    // image is its poster, and the migrated Seminars page drew a poster-less
    // box that played nothing when that binding was wrong.
    fixture.componentInstance.block = {
      key: 'k1', type: SECTION_ARCHETYPE.SECTION, variant: 'columns',
      columns: [{ key: 'c1', pieces: [{
        key: 'vid', kind: 'video', videoId: 'BLOCK-ID',
        image: { url: 'https://example.test/block-still.jpg', name: 'still' },
        isActive: true
      }] }],
      isActive: true
    } as never;
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();

    const poster = (fixture.nativeElement as HTMLElement)
      .querySelector('.kit-video__poster') as HTMLElement;

    expect(poster.style.backgroundImage).toContain('block-still.jpg');
  });
});
