import { Component, OnDestroy, OnInit } from '@angular/core';
import { HomePageImageModel } from 'src/app/common/models/domain/home-page-image.model';
import { HomePageImageService } from 'src/app/common/services/data/home-page-images.service';
import Swiper from 'swiper';
import { Autoplay, Pagination } from 'swiper/modules';

@Component({
    selector: 'app-home-header-slider',
    templateUrl: './home-header-slider.component.html',
    styleUrls: ['./home-header-slider.component.scss'],
    standalone: false
})
export class HomeHeaderSliderComponent implements OnInit, OnDestroy{
  public images: HomePageImageModel[] = [];
  private swiperInstance: Swiper | undefined;

  constructor(private service: HomePageImageService){}

  async ngOnInit() {
    this.images = await this.service.getAllByValue('isActive', true);

    this.images.sort((a,b) => a.order - b.order);

    // Swiper needs the *ngFor-rendered .swiper-slide elements to already be
    // in the DOM before it scans for them. ngAfterViewInit fires before this
    // async fetch resolves, so it's too early -- a setTimeout(0) instead
    // waits for the change detection pass this data update triggers to
    // actually paint the slides first.
    setTimeout(() => this.initSwiper());
  }

  private initSwiper(): void {
    if (this.images.length === 0) {
      return;
    }

    this.swiperInstance = new Swiper('.header-slider-container .swiper', {
      modules: [Autoplay, Pagination],
      slidesPerView: 1,
      loop: this.images.length > 1,
      speed: 1000,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false
      },
      pagination: {
        clickable: true,
        el: '.header-slider-pagination'
      }
    });
  }

  ngOnDestroy(): void {
    this.swiperInstance?.destroy();
  }
}
