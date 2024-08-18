import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CoachModel } from 'impactdisciplescommon/src/models/domain/coach.model';
import { CoachService } from 'impactdisciplescommon/src/services/coach.service';
import Swiper from 'swiper';
import { EffectFade, Pagination } from 'swiper/modules';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit, AfterViewInit {
  @ViewChild('heroSliderContainer') heroSliderContainer!: ElementRef;
  public swiperInstance: Swiper | undefined;

  coaches$: Promise<CoachModel[]>;

  constructor(private coachService: CoachService){}

  ngOnInit(): void {
    this.coaches$ = this.coachService.getAll()

  }

  ngAfterViewInit() {
    if (this.heroSliderContainer) {
      this.swiperInstance = new Swiper('.slider-active', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: false,
        effect: 'fade',
        modules: [Pagination, EffectFade],
        pagination: {
          clickable: true,
          el: '.tp-slider-dot',
        },
      });
    }
  }

}
