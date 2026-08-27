import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: false
})
export class HeaderComponent {
  @Input() backgroundUrl: string;

  /**
   * Optional phone/tablet cut of the hero picture, used below 992px.
   *
   * Several of these heroes are wide banner GRAPHICS with the subject pushed
   * to one side - the store header is book covers in the right half of a
   * 1622x696 canvas, the rest empty. Fitting one whole into a phone frame
   * makes it too small to read; filling the frame crops the subject out.
   * Neither is fixable in CSS, so a hero that matters on a phone gets its own
   * file, the same way a home slide does (HomePageImageModel.mobileImage).
   *
   * Omitted on a page whose hero is an ordinary photograph - those crop
   * gracefully and do not need one.
   */
  @Input() mobileBackgroundUrl?: string;

  /** Matches $md's upper bound in the theme breakpoints, so the picture and
   *  the layout rules change at the same width. */
  private static readonly MOBILE_MAX_WIDTH = 991;

  /** The picture for the CURRENT viewport - the mobile cut when there is one
   *  and the screen is narrow, otherwise the wide original. */
  get heroUrl(): string {
    const narrow = typeof window !== 'undefined'
      && window.innerWidth <= HeaderComponent.MOBILE_MAX_WIDTH;
    return (narrow && this.mobileBackgroundUrl) || this.backgroundUrl;
  }
  @Input() pretitle: string;
  @Input() title: string;
  @Input() description: string;
  @Input() showHr = false;
  @Input() buttonLink: string;
  @Input() buttonText: string;
  @Input() buttonIcon: string;
  @Input() buttonLink2: string;
  @Input() buttonText2: string;
  @Input() buttonIcon2: string;
  @Input() buttonLink3: string;
  @Input() buttonText3: string;
  @Input() buttonIcon3: string;
  @Input() buttonClick = false;
  @Input() buttonClick2 = false;
  @Output() buttonClickAction = new EventEmitter<void>();
  @Output() buttonClickAction2 = new EventEmitter<void>();

  onButtonClick () {
    this.buttonClickAction.emit();
  }
  onButtonClick2 () {
    this.buttonClickAction2.emit();
  }
}