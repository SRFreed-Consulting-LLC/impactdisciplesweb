import { Component, OnDestroy, OnInit } from '@angular/core';
import { HomePageImageModel } from '@impact-common/shared/models/domain/home-page-image.model';
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

  /** Matches $md's upper bound in the theme's breakpoints - see
   *  assets/styles/theme/scss/_variables.scss. Above this the desktop image
   *  is used; at or below it a slide's own mobileImage wins if it has one. */
  private static readonly MOBILE_MAX_WIDTH = 991;

  constructor(private service: HomePageImageService){}

  /**
   * The picture this slide should show at the CURRENT viewport width.
   *
   * A slide may carry a phone/tablet cut of its artwork (mobileImage). Wide
   * desktop banners do not survive a 390px frame - fitting the whole thing in
   * shrinks the wordmark past reading, and filling the frame crops half the
   * picture away - so a slide that matters on a phone gets its own file.
   *
   * Falls back to `image` whenever there is no mobile cut, which is every
   * slide until someone uploads one, so nothing changes by default.
   */
  slideImageUrl(item: HomePageImageModel): string | undefined {
    const isNarrow = typeof window !== 'undefined'
      && window.innerWidth <= HomeHeaderSliderComponent.MOBILE_MAX_WIDTH;
    return (isNarrow && item.mobileImage?.url) || item.image?.url;
  }

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
