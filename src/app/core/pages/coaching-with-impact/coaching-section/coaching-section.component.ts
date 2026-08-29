import {
  AfterViewInit, Component, Input, OnChanges, OnDestroy
} from '@angular/core';
import Swiper from 'swiper';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { PageContentBlock, PageContentItem } from '@impact-common/shared/models/domain/page-content.model';
import { TestimonialModel } from '@impact-common/shared/models/domain/testimonial.model';
import { TESTIMONIAL_TYPES } from '@impact-common/shared/lists/testimonial_types.enum';
import { PAGE_SECTION_TYPES } from '@impact-common/shared/lists/page_section_types.enum';
import { TestimonialService } from 'src/app/common/services/data/testimonial.service';

export interface CoachTestimonial {
  quote: string[];
  name: string;
  role: string;
}

/**
 * A stored testimonial as this page renders it.
 *
 * PARAGRAPHS ARE THE POINT. TestimonialModel.text is one string, but three of
 * these quotes run to two or three paragraphs, and running them together
 * turns a considered testimonial into a wall. Blank lines are the paragraph
 * break - that is the shape the migration wrote and the shape the admin
 * screen preserves - so a single quote is simply a one-item array.
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

/**
 * Renders ONE section of the Coaching with Impact page, whichever type it is.
 *
 * A type this build does not recognise renders NOTHING rather than failing -
 * the data outlives the build.
 */
@Component({
    selector: 'app-coaching-section',
    templateUrl: './coaching-section.component.html',
    // The page's own stylesheet, unchanged and unmoved - with emulated
    // encapsulation a rule only reaches the component that renders the
    // element it names. The `.cwi` wrapper stays in the page; Angular scopes
    // only the LAST part of a selector, so an ancestor outside this component
    // still matches.
    styleUrls: ['../coaching-with-impact.component.scss'],
    standalone: false
})
export class CoachingSectionComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) block!: PageContentBlock;

  readonly types = PAGE_SECTION_TYPES;

  isPlaying = false;

  /** The quotes this carousel shows, in the order the section asks for. */
  testimonials: CoachTestimonial[] = [];

  private swiper: Swiper | undefined;

  constructor(private testimonialService: TestimonialService) {}

  ngOnChanges(): void {
    if (this.block?.type === PAGE_SECTION_TYPES.TESTIMONIALS) {
      // Guarded so a failed read leaves an empty carousel rather than
      // throwing out of a lifecycle hook and taking the page with it.
      this.loadTestimonials(this.block.testimonialIds ?? []).catch(() => undefined);
    }
  }

  playVideo(): void {
    this.isPlaying = true;
  }

  get liveItems(): PageContentItem[] {
    return (this.block.items ?? []).filter((item) => item.isActive);
  }

  /**
   * The coach testimonials this page shows, and the order it shows them in.
   *
   * TWO SEPARATE RULES:
   *
   *   - WHETHER a quote appears is its own `isActive` - the Live switch. It
   *     is a property of the testimonial, not of this page.
   *   - THE ORDER is the section's, held in `testimonialIds`. Ids the section
   *     knows come first, in its order; any other live coach testimonial is
   *     appended by author.
   *
   * That appending is what makes a newly added quote appear without anyone
   * re-saving this page - and it is why an empty list is not an early return:
   * a section that has never had its order saved should still show the live
   * testimonials.
   *
   * An id that no longer resolves is skipped - deleting a testimonial should
   * shorten the carousel, not leave a blank slide in it.
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

    // The slides are fetched, so they paint AFTER this resolves - Swiper has
    // to wait for the change-detection pass that draws them, the same
    // setTimeout(0) home-header-slider uses and for the same reason.
    setTimeout(() => this.initSwiper());
  }

  ngAfterViewInit(): void {
    if (this.block?.type === PAGE_SECTION_TYPES.TESTIMONIALS) {
      setTimeout(() => this.initSwiper());
    }
  }

  private initSwiper(): void {
    if (this.swiper || !this.testimonials.length) {
      return;
    }
    this.swiper = new Swiper('.cwi-testimonials__swiper', {
      modules: [Autoplay, Navigation, Pagination],
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      speed: 600,
      autoHeight: true,
      // Deliberately slow: these are long quotes, and a reader part-way
      // through one should not have it move under them.
      autoplay: { delay: 12000, disableOnInteraction: true },
      pagination: { el: '.cwi-testimonials__pagination', clickable: true },
      navigation: {
        nextEl: '.cwi-testimonials__next',
        prevEl: '.cwi-testimonials__prev',
      },
      breakpoints: {
        992: { slidesPerView: 2 },
      },
    });
  }

  ngOnDestroy(): void {
    this.swiper?.destroy();
  }
}
