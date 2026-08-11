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
  @Output() buttonClickAction = new EventEmitter<void>();
  @Output() buttonClickAction2 = new EventEmitter<void>();

  onButtonClick () {
    this.buttonClickAction.emit();
  }
  onButtonClick2 () {
    this.buttonClickAction2.emit();
  }
}