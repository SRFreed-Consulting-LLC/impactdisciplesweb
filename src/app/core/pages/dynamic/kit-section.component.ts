import {
  AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy
} from '@angular/core';
import Swiper from 'swiper';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import {
  ContentPiece, PageContentBlock, PageContentItem, SectionColumn
} from '@impact-common/shared/models/domain/page-content.model';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { TestimonialModel } from '@impact-common/shared/models/domain/testimonial.model';
import { TESTIMONIAL_TYPES } from '@impact-common/shared/lists/testimonial_types.enum';
import {
  DEFAULT_PAGE_THEME,
  PageTheme,
  SECTION_ARCHETYPE,
  SectionSurface,
  resolveSurface
} from '@impact-common/shared/lists/section_kit';
import { TestimonialService } from 'src/app/common/services/data/testimonial.service';
import { SubscribeFormService, SubscriberDetails } from 'src/app/shared/utils/services/subscribe-form.service';
import { environment } from 'src/environments/environment';

/** The destinations a button may NAME rather than address - see href(). */
const KIT_LINK_DESTINATIONS: Record<string, string> = {
  one: environment.oneGiftUrl,
  monthly: environment.monthlyGiftUrl,
  partners: environment.impactPartnersGiftUrl,
  reader: environment.readerAppOrigin
};

/**
 * ONE section of ANY page - and there are only two kinds left.
 *
 * A SECTION is one to three columns of content pieces. A LIST is one item
 * shape repeated, in one of ten looks. Between them they draw every page
 * on the site.
 *
 * THE FOURTEEN ARCHETYPES WERE DELETED ON 2026-09-01, once every page had
 * migrated and nothing stored one. They were the step between nine bespoke
 * page components and these two: useful while it ran, and two vocabularies
 * for the same thing the moment it stopped.
 *
 * A TYPE THIS BUILD CANNOT DRAW STILL RENDERS NOTHING rather than failing.
 * The data outlives the build - a document written by a later version has
 * to survive being read by this one - and that silence is exactly why the
 * spec renders every member of the kit and every piece kind and fails if
 * one produces no output.
 *
 * THE TWO SERVICES INJECTED HERE are the two behaviours a section owns
 * rather than reads: a List of quotes resolves its stored testimonial ids,
 * and the sign-up piece submits to a mailing list. Everything else arrives
 * through inputs, handed down by the page so twenty sections cost one read.
  */
/** A stored testimonial as the carousel renders it. */
export interface CoachTestimonial {
  quote: string[];
  name: string;
  role: string;
}

/**
 * PARAGRAPHS ARE THE POINT. TestimonialModel.text is one string, but the
 * long quotes run to two or three paragraphs, and running them together
 * turns a considered testimonial into a wall. Blank lines are the break -
 * the shape the migration wrote and the admin preserves.
 *
 * MOVED HOME from coaching-section when that component was deleted with its
 * page's cutover (2026-08-31) - the kit's carousel is the transform's only
 * caller now.
 */
export function toCoachTestimonial(t: TestimonialModel): CoachTestimonial {
  const quote = (t.text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return {
    quote: quote.length ? quote : [(t.text ?? '').trim()],
    name: t.author ?? '',
    role: t.title ?? ''
  };
}

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

  /**
   * WHICH video is playing, or null.
   *
   * A boolean until 2026-08-31, which was enough while a section could
   * only hold one video. A column can hold several now, and one flag meant
   * clicking either play button started every one of them at once.
   */
  playing: string | null = null;

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
    // A List of QUOTES is the one look whose items are not its own: the
    // quotes belong to the Testimonials screen, because the same quote
    // can appear on more than one page, and the section stores the order.
    if (this.listLook === 'quotes') {
      this.loadTestimonials(this.block.testimonialIds ?? []).catch(() => undefined);
    }
    // A Section may hold a countdown piece; nothing else has a clock.
    if (this.block?.type === SECTION_ARCHETYPE.SECTION) {
      this.startCountdown();
    }
  }

  ngAfterViewInit(): void {
    // The two looks that rotate. setTimeout because both libraries
    // measure the DOM, which does not exist until after this hook.
    if (this.listLook === 'quotes') {
      setTimeout(() => this.initSwiper());
    }
    if (this.listLook === 'slides') {
      setTimeout(() => this.initSlider());
    }
  }

  ngOnDestroy(): void {
    this.swiper?.destroy();
    this.stopCountdown();
  }

  /**
   * The id a numbered row carries and its strip link jumps to.
   *
   * Scoped by the block's key, because two numbered lists on one page would
   * otherwise both claim `#row-1` and every link would land on the first.
   * Derived from POSITION rather than the title: a title can be edited to
   * something that is not a valid fragment, and reordering must move the
   * anchor with the row, which position does for free.
   */
  rowAnchor(index: number): string {
    return `${this.block?.key ?? 'row'}-${index + 1}`;
  }

  // ------------------------------------------------- columns and pieces

  /**
   * WHICH RENDERING to use, which is not always the stored type.
   *
   * A LIST block names a LOOK, and every look is one of the archetypes this
   * template already draws. Mapping it here means the switch falls through
   * to markup that exists rather than a second copy of it - one rendering,
   * not two drifting apart while the migration runs. Stage 4 inlines the
   * survivors and deletes the rest.
   */
  /**
   * WHICH RENDERING each List look uses.
   *
   * Four of the ten share one - tiles, picture rows, icon tiles and price
   * tiles are the same grid carrying different things, and articles and
   * numbered articles are one row treatment counted or not. The rest have
   * a rendering to themselves.
   *
   * UNTIL 2026-09-01 this mapped each look onto one of the FOURTEEN
   * archetypes and the markup was borrowed from them, so the two
   * vocabularies had to stay in step for the length of the migration. The
   * archetypes are gone; these are the renderings themselves now, named
   * after what they draw rather than after what they used to be.
   */
  private static readonly LIST_LOOKS: Record<string, string> = {
    tiles: 'grid',
    pictureRows: 'grid',
    icon: 'grid',
    price: 'grid',
    rows: 'rows',
    articles: 'articles',
    numbered: 'articles',
    timeline: 'timeline',
    quotes: 'quotes',
    slides: 'slides'
  };

  /** The rendering this block wants, or undefined when it is not a List. */
  private get listLook(): string | undefined {
    return this.block?.type === SECTION_ARCHETYPE.LIST
      ? KitSectionComponent.LIST_LOOKS[this.block.variant ?? '']
      : undefined;
  }

  get renderAs(): string {
    return this.listLook ?? this.block?.type ?? '';
  }

  /**
   * How many columns the row is divided into.
   *
   * FULL-WIDTH COLUMNS DO NOT COUNT. A heading over two columns is a
   * two-column section, not a three-column one - counting it would make the
   * grid a third narrower and nothing would line up with the band above.
   */
  get columnCount(): number {
    const shared = this.liveColumns.filter((column) => !column.full).length;
    return Math.min(3, Math.max(1, shared || 1));
  }

  /**
   * Whether the PICTURE column comes first.
   *
   * Only the wider track needs to know: on a large media split the grid
   * gives one column the bigger share, and if the picture moved to the left
   * without the track moving with it, the words would get the picture's
   * share. The same rule .kit-split has always followed.
   */
  /**
   * Whether one of the columns is a PICTURE column.
   *
   * Only then does the uneven split apply. Without this the ratio reached
   * every two-column section, including the form band - whose two halves are
   * even on the site, and came out 607/697 in the comparison.
   */
  get hasMediaColumn(): boolean {
    return this.liveColumns
      .filter((column) => !column.full)
      .some((column) => this.isMediaColumn(column));
  }

  private isMediaColumn(column: SectionColumn): boolean {
    const pieces = this.livePieces(column);
    // `every` on an empty list is true, which would make an empty column
    // read as a picture column.
    return pieces.length > 0
      && pieces.every((piece) => piece.kind === 'picture' || piece.kind === 'video');
  }

  get mediaColumnFirst(): boolean {
    const shared = this.liveColumns.filter((column) => !column.full);
    const first = shared[0];
    if (!first) {
      return false;
    }
    const pieces = this.livePieces(first);
    // `every` on an empty list is true, which would make an empty first
    // column read as a picture column and hand the wider track to nothing.
    return pieces.length > 0
      && pieces.every((piece) => piece.kind === 'picture' || piece.kind === 'video');
  }

  /**
   * Whether this section draws nothing a sighted visitor can see - every
   * live piece in it is a heading marked "read, but not shown".
   *
   * The section still has to EXIST: its heading is in the markup, which is
   * the whole point of it. It must not take a band of empty page, though,
   * and it did on the home page's first deploy of this - 160px of nothing
   * above the slider, which is exactly the band the hidden heading was
   * meant to avoid.
   *
   * False for a LIST, which has no columns, so its items are unaffected.
   */
  get onlyHiddenContent(): boolean {
    const pieces = this.liveColumns.flatMap((column) => this.livePieces(column));
    return pieces.length > 0 && pieces.every((piece) => !!piece.hidden);
  }

  get liveColumns(): SectionColumn[] {
    return (this.block.columns ?? []).filter((column) => !!column);
  }

  /** Switched-off pieces are left out, the same rule as sections and
   *  entries - absent counts as live. */
  livePieces(column: SectionColumn): ContentPiece[] {
    return (column.pieces ?? []).filter((piece) => piece.isActive !== false);
  }

  /** A column's painted box, from the same fixed palette as everywhere else.
   *  Re-declares the ink tokens, so every piece inside follows the ground
   *  without knowing it exists. */
  columnClasses(column: SectionColumn): string {
    return [
      column.full ? 'kit-col--full' : '',
      column.align === 'centre' ? 'kit-col--centre' : '',
      column.measure ? 'kit-col--measure' : '',
      column.inset ? 'kit-col--inset' : '',
      column.ground && column.ground !== 'none' ? `kit-card--${column.ground}` : '',
      column.ground && column.ground !== 'none'
        ? `kit-cardink--${column.ink ?? (column.ground === 'panel' ? 'dark' : 'light')}`
        : '',
      column.titleTone === 'brand' ? 'kit-tt--brand' : ''
    ].filter(Boolean).join(' ');
  }

  /** A buttons piece's own list. Same shape and the same href() resolution
   *  as every other button on the site. */
  pieceButtons(piece: ContentPiece): PageContentItem[] {
    return (piece.buttons ?? []).filter((button) => button.isActive !== false);
  }

  /** A price piece NAMES a Web Config figure. Null rather than 0 when it
   *  cannot be resolved, and the template draws no line at all. */
  pieceAmount(piece: ContentPiece): number | null {
    const key = piece.amountKey;
    if (!key || !this.webConfig) {
      return null;
    }
    const value = (this.webConfig as unknown as Record<string, unknown>)[key];
    return typeof value === 'number' ? value : null;
  }

  /** The first countdown piece's date, for a section built from pieces. The
   *  flat `targetDate` still wins for a block written the old way. */
  private get pieceTargetDate(): string | undefined {
    for (const column of this.liveColumns) {
      const clock = this.livePieces(column).find((piece) => piece.kind === 'countdown');
      if (clock?.targetDate) {
        return clock.targetDate;
      }
    }
    return undefined;
  }

  // ------------------------------------------------------------- countdown

  /** Days/hours/minutes/seconds remaining, or null when there is nothing to
   *  count to - see startCountdown(). */
  remaining: { days: number; hours: number; minutes: number; seconds: number } | null = null;

  private ticker: ReturnType<typeof setInterval> | undefined;

  /**
   * Counts to the section's own `targetDate`.
   *
   * NOTHING IS DRAWN when the date is missing, unparseable, or already past.
   * A row of zeros reads as "it starts now" and a negative count reads as a
   * bug; both are worse than the band simply not carrying a clock. The
   * heading and button still render, so a section whose date has gone by
   * degrades into an ordinary banner rather than disappearing.
   */
  private startCountdown(): void {
    this.stopCountdown();
    const target = Date.parse(this.block.targetDate ?? this.pieceTargetDate ?? '');
    if (!Number.isFinite(target)) {
      this.remaining = null;
      return;
    }
    const tick = () => {
      const left = target - Date.now();
      if (left <= 0) {
        this.remaining = null;
        this.stopCountdown();
        return;
      }
      const seconds = Math.floor(left / 1000);
      this.remaining = {
        days: Math.floor(seconds / 86400),
        hours: Math.floor((seconds % 86400) / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
        seconds: seconds % 60
      };
    };
    tick();
    this.ticker = setInterval(tick, 1000);
  }

  private stopCountdown(): void {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = undefined;
    }
  }

  /** Two digits, so the clock does not jitter as numbers change width. */
  pad(value: number): string {
    return String(value).padStart(2, '0');
  }

  // ---------------------------------------------------------------- slider

  private initSlider(): void {
    if (this.swiper || this.liveItems.length < 1) {
      return;
    }
    const el = this.host.nativeElement.querySelector<HTMLElement>('.kit-slider__swiper');
    if (!el) {
      return;
    }
    this.swiper = new Swiper(el, {
      modules: [Autoplay, Pagination],
      slidesPerView: 1,
      loop: this.liveItems.length > 1,
      // Slower than the quote carousel: a slide here carries a picture and a
      // call to action, and the eye has further to travel than a sentence.
      autoplay: { delay: 7000, disableOnInteraction: true },
      pagination: { el: el.querySelector<HTMLElement>('.swiper-pagination') ?? undefined, clickable: true }
    });
  }

  playVideo(key?: string): void {
    this.playing = key ?? 'block';
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

  // `leftColClasses` / `rightColClasses` were here until 2026-09-01. They
  // read the six fields - leftGround, leftInk, leftTitleTone and their
  // right-hand twins - that encoded "two columns with their own colours"
  // before a section could have columns. Each column carries its own ground
  // now, so two hard-coded halves cannot say anything a real column cannot.

  get gridGroundClasses(): string {
    // The variant class rides along so a grid can be styled per LOOK - the
    // price tiles centre as a row, the picture rows go horizontal - and the
    // cards-per-row choice as a counted class (absent = as many as fit).
    const perRow = this.block.cardsPerRow ? ` kit-cols--${this.block.cardsPerRow}` : '';
    return `kit-gv--${this.variant}${perRow} ${this.groundClasses(this.block.cardGround, this.block.cardInk)}`;
  }

  // `mediaLeft` was here until 2026-09-01, and with it the last reader of
  // `block.mediaSide`. It answered "which side is the picture on" for a
  // composed archetype that had a picture half and a words half. A Section
  // answers it by which COLUMN holds the picture - see mediaColumnFirst -
  // which is the same thing said once, in the place staff actually drag.
  // The per-ENTRY alternation the article and timeline looks still want is
  // `entryOnLeft(i)`, which never went through here.

  /** Buttons, wherever a section has them: entries, so a third is an add.
   *  `ctaTitle` is still read for blocks written before the change - the
   *  data outlives the build, and a migrated page must not lose a button. */
  get buttons(): PageContentItem[] {
    if (this.liveItems.length) {
      return this.liveItems;
    }
    const legacy: PageContentItem[] = [];
    if (this.block.ctaTitle) {
      legacy.push({ title: this.block.ctaTitle, link: this.block.ctaUrl, isActive: true } as PageContentItem);
    }
    if (this.block.ctaTitle2) {
      legacy.push({ title: this.block.ctaTitle2, link: this.block.ctaUrl2, isActive: true } as PageContentItem);
    }
    return legacy;
  }

  /** Which look within the archetype, defaulting to the first so a block
   *  written before variants existed still draws something. */
  /**
   * The stored look, which the shared renderings branch on - a grid draws
   * a picture tile, an icon tile or a price tile from this, and the
   * article rows are counted or not.
   *
   * It used to TRANSLATE a look into the old archetype variant the
   * borrowed markup expected. There is nothing to translate to any more.
   */
  get variant(): string {
    return this.block?.variant ?? '';
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

  // ------------------------------------------------------- destinations

  /**
   * WHERE A MONEY OR SIBLING-APP BUTTON GOES IS A KEY, NEVER A STORED URL.
   *
   * Give's three buttons store 'one'/'monthly'/'partners' and the Library's
   * two store 'reader'; this build resolves them. That is a security
   * decision carried over from the bespoke Give page: a stored payment URL
   * would let anyone who can edit content redirect donations, and the
   * reader's address belongs to whoever deploys that app, not to page copy.
   *
   * Everything else passes through untouched - an ordinary button's stored
   * address ('/seminar-form', a full https URL) is not a destination key.
   *
   * Null when there is nothing usable, and the templates draw NO button in
   * that case: a dead button looks exactly like a working one, which is how
   * all five of these shipped dead through every visual approval pass
   * (caught 2026-08-30 by reading the hrefs, not the pixels).
   */
  href(item: { link?: string; ctaUrl?: string }): string | null {
    const stored = item.link ?? item.ctaUrl;
    if (!stored) {
      return null;
    }
    return KIT_LINK_DESTINATIONS[stored] ?? stored;
  }

  href2(item: { ctaUrl2?: string }): string | null {
    return item.ctaUrl2 ? (KIT_LINK_DESTINATIONS[item.ctaUrl2] ?? item.ctaUrl2) : null;
  }

  /**
   * Where a button opens: a new tab when staff asked for that on the button,
   * otherwise null so the attribute is ABSENT rather than `target="null"`.
   *
   * The Give page's donation buttons are why this exists (2026-09-03): they
   * leave for a payment provider, and were taking the visitor off the site
   * with them. Every place an entry's link is drawn goes through this, so a
   * button behaves the same whichever look its section wears.
   */
  target(item: { newTab?: boolean }): '_blank' | null {
    return item.newTab ? '_blank' : null;
  }

  /** `noopener` travels with `_blank`: without it the page that opens gets
   *  a handle on this one. Null otherwise, for the same reason as target(). */
  rel(item: { newTab?: boolean }): 'noopener' | null {
    return item.newTab ? 'noopener' : null;
  }

  // `leftItems` / `rightItems` lived here until 2026-09-01. They split ONE
  // archetype's entries by a stored `column`, which is what a Section's two
  // columns of pieces do properly now - the entries were never the columns,
  // they were a list pretending to be one.

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

  /**
   * A heading as SPOKEN text, with its markup removed.
   *
   * Headings legitimately carry `<strong>` - that is the site's own way of
   * painting a word brand-yellow - and rendering one through [innerHTML] is
   * correct. Putting the same string in an aria-label is not: the play
   * button announced "Play WHAT YOU <strong> GET</strong>" to a screen
   * reader, tags and all, while looking perfectly fine on screen (found
   * 2026-08-31 by reading the accessibility tree, which is the only place
   * this is visible).
   *
   * Uses the DOM's own parser rather than a tag regex: a regex over
   * user-editable HTML gets entities (&amp;, &nbsp;) wrong, and this text is
   * read aloud, where "&amp;" instead of "and" is exactly the kind of thing
   * nobody would ever catch.
   */
  /**
   * Whether a piece actually has words in it.
   *
   * Plain-string, deliberately - `spoken()` below builds a DOM node to read
   * text out of markup, which is right for one aria-label and wrong for a
   * template guard that runs on every change-detection pass for every piece
   * on the page.
   *
   * `<p></p>` is as empty as `''`: rich text arrives as HTML and a
   * rich-text box that has been typed in and cleared leaves its tags behind.
   */
  hasWords(value: string | undefined): boolean {
    return !!value && value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() !== '';
  }

  /**
   * The words a video in this section is announced by when the video piece
   * carries none of its own.
   *
   * A video used to be a FIELD on a block that also held the heading, so the
   * play button could always find something to speak. As a piece it has only
   * its own caption, and almost no video on the site has one - the heading
   * sits beside it as a separate piece. Without this, every migrated page
   * announced "Play the video" and nothing more (2026-09-01).
   *
   * First heading anywhere in the section, in column then piece order, which
   * is reading order: the one a sighted visitor sees above the player.
   */
  get sectionHeading(): string | undefined {
    for (const column of this.liveColumns) {
      const heading = this.livePieces(column)
        .find((piece) => piece.kind === 'heading' && this.hasWords(piece.text));
      if (heading) {
        return heading.text;
      }
    }
    return undefined;
  }

  spoken(html: string | undefined, fallback: string): string {
    if (!html) {
      return fallback;
    }
    const el = document.createElement('div');
    el.innerHTML = html;
    return (el.textContent || '').replace(/\s+/g, ' ').trim() || fallback;
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
  /** A signup PIECE names its own list; a block written the old way carries
   *  it on the block. Whichever is present wins, defaulting to newsletter. */
  async handleSignup(list?: 'newsletter' | 'prayer'): Promise<void> {
    if (this.signupBusy) {
      return;
    }
    this.signupBusy = true;
    try {
      await this.subscribeForm.submit(list ?? this.block.signupList ?? 'newsletter', this.signup);
      this.signup = { firstName: '', lastName: '', email: '' };
    } finally {
      this.signupBusy = false;
    }
  }
}
