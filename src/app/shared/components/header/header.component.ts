import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: false
})
export class HeaderComponent {
  @Input() backgroundUrl: string;
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

  /** Shorter banner for pages that lead with content rather than a picture. */
  @Input() compact = false;

  @Output() buttonClickAction = new EventEmitter<void>();
  @Output() buttonClickAction2 = new EventEmitter<void>();

  // The old template rendered an empty `.buttons` div on every page that
  // passed no button at all, which left a gap under the title.
  get hasButtons(): boolean {
    return !!(
      this.buttonLink || this.buttonLink2 || this.buttonLink3 ||
      (this.buttonClick && this.buttonText) ||
      (this.buttonClick2 && this.buttonText2)
    );
  }

  onButtonClick() {
    this.buttonClickAction.emit();
  }

  onButtonClick2() {
    this.buttonClickAction2.emit();
  }
}
