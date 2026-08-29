import { Component, Input } from '@angular/core';

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
  /** The word wrapped in <strong> is the one before the last line break. */
  @Input() title = 'DISCOVER <strong>POWERFUL</strong> DISCIPLE-MAKING RESOURCES';

  @Input() subtitle =
    'Explore our store for impactful resources crafted to guide your ' +
    'disciple-making efforts. Our collection of books is designed to ' +
    'provide practical tools and biblical insights that will deepen your ' +
    'faith and extend your impact. Start your journey today with the ' +
    'perfect resource.';

  @Input() imageUrl =
    'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/' +
    'Store%2FDMC-Series_Five-Images-1.png?alt=media&token=97f755c0-3c73-4545-979c-6428c3f2ab98';

  @Input() ctaTitle = 'VISIT OUR STORE';

  /** An in-app route, or 'external' to use ctaUrl instead. */
  @Input() ctaDestination = '/store';

  @Input() ctaUrl?: string;

  get isExternal(): boolean {
    return this.ctaDestination === 'external';
  }
}
