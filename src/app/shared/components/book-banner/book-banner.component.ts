import { Component, Input } from '@angular/core';
import { HOME_BANNER_DEFAULT } from 'src/app/shared/utils/data/home-section-defaults';

/**
 * Picture on one side, copy and a button on the other.
 *
 * Named for the book series it currently advertises, but nothing about it
 * is book-specific - it is the generic `banner` section type, and more than
 * one may sit on the page.
 */
@Component({
    selector: 'app-book-banner',
    templateUrl: './book-banner.component.html',
    styleUrls: ['./book-banner.component.scss'],
    standalone: false
})
export class BookBannerComponent {
  /** Rendered with innerHTML - the copy carries <strong> markup. */
  @Input() title = HOME_BANNER_DEFAULT.title;

  @Input() subtitle = HOME_BANNER_DEFAULT.subtitle;

  @Input() imageUrl = HOME_BANNER_DEFAULT.imageUrl;

  @Input() ctaTitle = HOME_BANNER_DEFAULT.ctaTitle;

  /** An in-app route, or 'external' to use ctaUrl instead. */
  @Input() ctaDestination = HOME_BANNER_DEFAULT.ctaDestination;

  @Input() ctaUrl?: string;

  get isExternal(): boolean {
    return this.ctaDestination === 'external';
  }
}
