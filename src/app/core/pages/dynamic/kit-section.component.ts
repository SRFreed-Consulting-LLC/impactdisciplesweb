import { Component, Input } from '@angular/core';
import { PageContentBlock, PageContentItem } from '@impact-common/shared/models/domain/page-content.model';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import {
  DEFAULT_PAGE_THEME,
  PageTheme,
  SECTION_ARCHETYPE,
  SectionSurface,
  resolveSurface,
  variantDef
} from '@impact-common/shared/lists/section_kit';

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
 * FIVE OF THE FOURTEEN ARCHETYPES so far - the ones a new page cannot be
 * built without. An archetype this build cannot draw renders NOTHING rather
 * than failing, the same rule the other nine follow: the data outlives the
 * build. That silence is exactly why `kit-section.component.spec.ts` renders
 * every archetype in the kit and fails if one produces no output.
 */
@Component({
  selector: 'app-kit-section',
  templateUrl: './kit-section.component.html',
  styleUrls: ['./kit-section.component.scss'],
  standalone: false
})
export class KitSectionComponent {
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

  /** Only a 'photo' surface paints the block's image behind the words; every
   *  other surface uses that image as content. */
  get backgroundImage(): string | null {
    const url = this.block.image?.url;
    return this.surface === 'photo' && url ? `url(${url})` : null;
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
}
