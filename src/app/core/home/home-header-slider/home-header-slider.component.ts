import { Component, ElementRef, ViewChild } from '@angular/core';
import Swiper from 'swiper';
import { EffectFade, Pagination } from 'swiper/modules';
import { HomeHeaderSlider } from '../../../shared/utils/models/home-header-slider.model';
import homeHeaderSlider from '../../../shared/utils/data/home-header-slider-data';

@Component({
  selector: 'app-home-header-slider',
  templateUrl: './home-header-slider.component.html',
  styleUrls: ['./home-header-slider.component.scss']
})
export class HomeHeaderSliderComponent {
  @ViewChild('heroSliderContainer') heroSliderContainer!: ElementRef;
  
  public swiperInstance: Swiper | undefined;

  ngAfterViewInit() {
    if (this.heroSliderContainer) {
      this.swiperInstance = new Swiper('.slider-active', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        effect : 'fade',
        modules:[Pagination,EffectFade],
        pagination: {
          clickable: true,
          el:'.tp-slider-dot-2'
        },
        autoplay: {
          delay: 5000,
          disableOnInteraction: false
        }
      })
    }
  }

  pauseAutoplay() {
    if (this.swiperInstance && this.swiperInstance.autoplay) {
      this.swiperInstance.autoplay.stop();
    }
  }

  resumeAutoplay() {
    if (this.swiperInstance && this.swiperInstance.autoplay) {
      this.swiperInstance.autoplay.start();
    }
  }
}
