import {
  AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy
} from '@angular/core';
import Swiper from 'swiper';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { PageContentBlock, PageContentItem } from '@impact-common/shared/models/domain/page-content.model';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { TestimonialModel } from '@impact-common/shared/models/domain/testimonial.model';
import { TESTIMONIAL_TYPES } from '@impact-common/shared/lists/testimonial_types.enum';
import {
  DEFAULT_PAGE_THEME,
  PageTheme,
  SECTION_ARCHETYPE,
  SectionSurface,
  resolveSurface,
  variantDef
} from '@impact-common/shared/lists/section_kit';
import { TestimonialService } from 'src/app/common/services/data/testimonial.service';
import { SubscribeFormService, SubscriberDetails } from 'src/app/shared/utils/services/subscribe-form.service';
// The transform is coaching-section's, imported rather than copied: the
// paragraph-splitting rule ("blank lines are the break") is the shape the
// migration wrote, and two copies of it is how one page's quotes wrap
// differently from another's.
import { CoachTestimonial, toCoachTestimonial } from '../coaching-with-impact/coaching-section/coaching-section.component';

/**
 * ONE section of a staff-created page, whichever archetype it is.
 *
 * THE DIFFERENCE FROM THE OTHER NINE SECTION COMPONENTS. `about-section`,
 * `coaching-section` and the rest each draw ONE page's idiom, which is why
 * `banner` is a photo slider on About Us and a tinted call-to-action on
 * Coaching. This one draws a page nobody wrote a component for, so a type has
 * to mean one thing - and the differences that were carried by having nine
 * components are carried by `variant` and `surface` instead.
 *
 * IT DOES NOT REPLACE THEM YET. The twelve original pages still render
 * through their own components and are untouched by this file. Moving them
 * over is a separate piece of work that needs a rendered comparison first -
 * their look lives in 2,006 lines of page SCSS, 47 rules of which reach into
 * [innerHTML] content, and none of that has been carried across here.
 *
 * ALL FOURTEEN ARCHETYPES render (since 2026-08-30). An archetype a FUTURE
 * build cannot draw still renders NOTHING rather than failing, the same rule
 * the other nine components follow: the data outlives the build. That silence
 * is exactly why `kit-section.component.spec.ts` renders every archetype in
 * the kit and fails if one produces no output.
 *
 * THE TWO SERVICES INJECTED HERE are the two behaviours a section owns rather
 * than reads: the quote carousel resolves its stored testimonial ids, and the
 * sign-up form submits to a mailing list. Everything else arrives through
 * inputs, handed down by the page so twenty sections cost one read.
 */
@Component({
  selector: 'app-kit-section',
  templateUrl: './kit-section.component.html',
  styleUrls: ['./kit-section.component.scss'],
  standalone: false
})
export class KitSectionComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) block!: PageContentBlock;

  /** The page's prevailing look, which a section on 'inherit' takes. */
  @Input() theme: PageTheme = DEFAULT_PAGE_THEME;

  /**
   * This block's position among blocks OF ITS OWN KIND, for the archetypes
   * that alternate. Supplied by the page, never stored - a stored side is a
   * second source of truth that reordering silently breaks.
   */
  @Input() typeIndex = 0;

  /**
   * The site settings, for the one thing a section may READ but never store:
   * a price.
   *
   * An amount lives in Web Config and a tile names the field it wants, so a
   * figure only ever exists in one place. Handed down by the page rather than
   * injected here, so a page of twenty sections makes one read rather than
   * twenty - the same shape the equipping and seminars pages already use.
   */
  @Input() webConfig: WebConfigModel | null = null;

  readonly archetypes = SECTION_ARCHETYPE;

  isPlaying = false;

  // ------------------------------------------------------------- carousel

  /** The resolved quotes a CAROUSEL section shows. Empty until the read
   *  lands, and empty forever on every other archetype. */
  testimonials: CoachTestimonial[] = [];

  private swiper: Swiper | undefined;

  // -------------------------------------------------------------- sign-up

  /** The sign-up form's fields - the same three the prayer page asks for.
   *  WHICH details it asks for stays here in the site; only the list it
   *  joins is the section's. */
  signup: SubscriberDetails = { firstName: '', lastName: '', email: '' };
  signupBusy = false;

  constructor(
    private host: ElementRef<HTMLElement>,
    private testimonialService: TestimonialService,
    private subscribeForm: SubscribeFormService
  ) {}

  ngOnChanges(): void {
    if (this.block?.type === SECTION_ARCHETYPE.CAROUSEL) {
      this.loadTestimonials(this.block.testimonialIds ?? []).catch(() => undefined);
    }
  }

  ngAfterViewInit(): void {
    if (this.block?.type === SECTION_ARCHETYPE.CAROUSEL) {
      setTimeout(() => this.initSwiper());
    }
  }

  ngOnDestroy(): void {
    this.swiper?.destroy();
  }

  playVideo(): void {
    this.isPlaying = true;
  }

  /** Switched-off entries are left out, the same rule as everywhere else. */
  get liveItems(): PageContentItem[] {
    return (this.block.items ?? []).filter((item) => item.isActive);
  }

  /** The ground this section is actually drawn on, once the page theme has
   *  had its say. Resolved in the shared kit so the site and the admin
   *  preview cannot disagree about it. */
  get surface(): Exclude<SectionSurface, 'inherit'> {
    return resolveSurface(this.block.surface, this.theme);
  }

  /** Class the template hangs every colour off. One place, so an archetype's
   *  markup never mentions a colour. */
  get surfaceClass(): string {
    return `kit--${this.surface}`;
  }

  /**
   * The text-style options, as classes beside the surface class.
   *
   * ABSENT DEFAULTS TO THE SITE'S OWN STYLE - bold Lato-900 heading over the
   * wide 5px rule, soft #848b8a copy, grey dot bullets - measured off the
   * original pages, because Shane's verdict on the first comparison was
   * "as close as we can, but as options". A getter returning a STRING is
   * safe where the object getters were not: strings compare by value.
   */
  get styleClasses(): string {
    return [
      `kit-hs--${this.block.headingStyle ?? 'bold'}`,
      `kit-ct--${this.block.copyTone ?? 'soft'}`,
      `kit-bl--${this.block.bullets ?? 'dots'}`,
      `kit-cs--${this.block.copySize ?? 'compact'}`,
      `kit-ms--${this.block.mediaSize ?? 'large'}`
    ].join(' ');
  }

  /** Only a 'photo' surface paints the block's image behind the words; every
   *  other surface uses that image as content. */
  get backgroundImage(): string | null {
    const url = this.block.image?.url;
    return this.surface === 'photo' && url ? `url(${url})` : null;
  }

  /** Which part of the photo the band keeps when it crops - 'top' holds
   *  faces, 'bottom' foregrounds. A string, so safe as a getter. */
  get backgroundPosition(): string {
    const focus = this.block.photoFocus ?? 'center';
    return focus === 'center' ? 'center' : `center ${focus}`;
  }

  /**
   * The card-ground classes for one column or for the tile grid. Each
   * ground defaults its ink to what READS on it - brand defaults dark
   * because that is what the original equipping pages do - and the stored
   * ink overrides. Strings, so safe as computed values.
   */
  private groundClasses(
    ground: 'none' | 'panel' | 'brand' | 'dark' | undefined,
    ink: 'dark' | 'light' | undefined
  ): string {
    if (!ground || ground === 'none') {
      return '';
    }
    // Brand defaults LIGHT, deliberately departing from the original: its
    // grey-on-blue measures ~1.4:1 and Shane's verdict was "terrible".
    // Light on this blue is 3.6:1 - and Dark text stays one click away.
    const defaultInk = ground === 'panel' ? 'dark' : 'light';
    return `kit-card--${ground} kit-cardink--${ink ?? defaultInk}`;
  }

  get leftColClasses(): string {
    return this.groundClasses(this.block.leftGround, this.block.leftInk)
      + (this.block.leftTitleTone === 'brand' ? ' kit-tt--brand' : '');
  }

  get rightColClasses(): string {
    return this.groundClasses(this.block.rightGround, this.block.rightInk)
      + (this.block.rightTitleTone === 'brand' ? ' kit-tt--brand' : '');
  }

  get gridGroundClasses(): string {
    // The variant class rides along so a grid can be styled per LOOK - the
    // price tiles centre as a row, the picture rows go horizontal - and the
    // cards-per-row choice as a counted class (absent = as many as fit).
    const perRow = this.block.cardsPerRow ? ` kit-cols--${this.block.cardsPerRow}` : '';
    return `kit-gv--${this.variant}${perRow} ${this.groundClasses(this.block.cardGround, this.block.cardInk)}`;
  }

  /**
   * Whether the media sits on the LEFT.
   *
   * `auto` alternates by position, which is what About Us's story columns and
   * the Library's feature rows already do. A variant naming a fixed side gets
   * that side whatever its position.
   */
  get mediaLeft(): boolean {
    const side = variantDef(this.block.type ?? '', this.block.variant)?.mediaSide ?? 'auto';
    if (side === 'left') {
      return true;
    }
    if (side === 'right') {
      return false;
    }
    return this.typeIndex % 2 === 1;
  }

  /** Which look within the archetype, defaulting to the first so a block
   *  written before variants existed still draws something. */
  get variant(): string {
    return variantDef(this.block.type ?? '', this.block.variant)?.key ?? '';
  }

  /**
   * The figure an entry NAMES, resolved from Web Config.
   *
   * Null rather than 0 when it cannot be resolved, and the template draws no
   * price line at all in that case: a tile reading "$0" is worse than one
   * with no price, because it looks like an answer.
   *
   * The template used to print `amountKey` itself, which put the literal text
   * "inpersonSeminarCost" on the page where a price belonged - directly under
   * a comment claiming the page resolved it. Caught by looking at the page,
   * which no spec had done.
   */
  amount(item: PageContentItem): number | null {
    const key = item.amountKey;
    if (!key || !this.webConfig) {
      return null;
    }
    const value = (this.webConfig as unknown as Record<string, unknown>)[key];
    return typeof value === 'number' ? value : null;
  }

  // ------------------------------------------------------------- columns

  /** The passages of a LIST_COLUMNS section, split by the ONE stored
   *  position an entry may carry - see PageContentItem.column for why these
   *  two columns are assigned rather than derived. */
  get leftItems(): PageContentItem[] {
    return this.liveItems.filter((item) => item.column !== 'right');
  }

  get rightItems(): PageContentItem[] {
    return this.liveItems.filter((item) => item.column === 'right');
  }

  // ------------------------------------------ alternation, per entry

  /** Timeline and article rows alternate by their own position - counted,
   *  never stored, so dragging an entry cannot stack two the same way. */
  entryOnLeft(i: number): boolean {
    return i % 2 === 0;
  }

  /** The "01 / 02" chip on a numbered article row, counted from the order
   *  exactly as the strip is - neither is stored. */
  chip(i: number): string {
    return String(i + 1).padStart(2, '0');
  }

  /** An .mp4 in the image slot plays muted inline instead of drawing as a
   *  broken picture - the library feature rows' rule. */
  isVideo(item: PageContentItem): boolean {
    return /\.mp4(\?|$)/i.test(item.image?.url ?? '');
  }

  altFor(item: PageContentItem): string {
    return item.title || item.heading || '';
  }

  // ------------------------------------------------------------- carousel

  /**
   * Coaching-section's rules, kept identical so the eventual migration is a
   * data move and not a behaviour change: WHETHER a quote appears is its own
   * isActive; the section holds only the ORDER, ids first, every other live
   * quote appended by author; an id that no longer resolves is skipped.
   */
  private async loadTestimonials(ids: string[]): Promise<void> {
    const all = await this.testimonialService.getAllByValue('type', TESTIMONIAL_TYPES.COACHING);
    const live = (all ?? []).filter((t) => t.isActive);
    if (!live.length) {
      return;
    }

    const byId = new Map(live.map((t) => [t.id, t]));
    const known = ids
      .map((id) => byId.get(id))
      .filter((t): t is TestimonialModel => !!t);
    const knownIds = new Set(known.map((t) => t.id));
    const rest = live
      .filter((t) => !knownIds.has(t.id))
      .sort((a, b) => (a.author ?? '').localeCompare(b.author ?? ''));

    this.testimonials = [...known, ...rest].map((t) => toCoachTestimonial(t));

    // The slides paint after this resolves - Swiper has to wait for that
    // change-detection pass, the same setTimeout(0) coaching uses.
    setTimeout(() => this.initSwiper());
  }

  private initSwiper(): void {
    if (this.swiper || !this.testimonials.length) {
      return;
    }
    // Scoped to THIS component's element, not a document-wide class lookup:
    // the carousel is a singleton per page, but a selector that reaches the
    // whole document is one carousel away from initialising somebody else's.
    const el = this.host.nativeElement.querySelector<HTMLElement>('.kit-carousel__swiper');
    if (!el) {
      return;
    }
    this.swiper = new Swiper(el, {
      modules: [Autoplay, Navigation, Pagination],
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      speed: 600,
      autoHeight: true,
      // Deliberately slow, same as Coaching: long quotes, and a reader
      // part-way through one should not have it move under them.
      autoplay: { delay: 12000, disableOnInteraction: true },
      pagination: {
        el: this.host.nativeElement.querySelector<HTMLElement>('.kit-carousel__pagination'),
        clickable: true
      },
      navigation: {
        nextEl: this.host.nativeElement.querySelector<HTMLElement>('.kit-carousel__next'),
        prevEl: this.host.nativeElement.querySelector<HTMLElement>('.kit-carousel__prev')
      },
      breakpoints: {
        992: { slidesPerView: 2 }
      }
    });
  }

  // ------------------------------------------------------ contact details

  /** The postal address as one line, the same joining rule the footer uses -
   *  the details come from Web Config, which already feeds it. */
  get addressLine(): string {
    const address = this.webConfig?.address;
    if (!address) {
      return '';
    }
    const parts = [address.address1, address.address2, address.city, address.state, address.zip];
    return parts.filter((part) => !!part && String(part).trim()).join(', ');
  }

  // -------------------------------------------------------------- sign-up

  /** Joins the list the SECTION names - 'prayer' on a migrated Prayer Team,
   *  'newsletter' by default. The service owns the endpoint and the
   *  success/failure messaging, exactly as it does for the prayer page. */
  async handleSignup(): Promise<void> {
    if (this.signupBusy) {
      return;
    }
    this.signupBusy = true;
    try {
      await this.subscribeForm.submit(this.block.signupList ?? 'newsletter', this.signup);
      this.signup = { firstName: '', lastName: '', email: '' };
    } finally {
      this.signupBusy = false;
    }
  }
}
