import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CoachModel } from 'impactdisciplescommon/src/models/domain/coach.model';
import { CoachService } from 'impactdisciplescommon/src/services/data/coach.service';
import { map, Observable } from 'rxjs';
import Swiper from 'swiper';
import { EffectFade, Pagination } from 'swiper/modules';

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
  @Input() showHr: boolean = false;
  @Input() buttonLink: any;
  @Input() buttonText: string;
  @Input() buttonIcon: string;
  @Input() buttonLink2: any;
  @Input() buttonText2: string;
  @Input() buttonIcon2: string;
  @Input() buttonLink3: any;
  @Input() buttonText3: string;
  @Input() buttonIcon3: string;
  @Input() buttonClick: boolean = false;
  @Input() buttonClick2: boolean = false;
  @Output() buttonClickAction = new EventEmitter<any>();
  @Output() buttonClickAction2 = new EventEmitter<any>();

  onButtonClick () {
    this.buttonClickAction.emit();
  }
  onButtonClick2 () {
    this.buttonClickAction2.emit();
  }
}