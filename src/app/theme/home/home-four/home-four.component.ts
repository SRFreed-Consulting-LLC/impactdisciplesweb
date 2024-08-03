import { Component, ElementRef, ViewChild } from '@angular/core';
import Swiper from 'swiper';
import { Pagination, EffectFade } from 'swiper/modules';
import { HeroSliderData } from '../../shared/data/hero-slider-data';
import { ProductService } from '../../shared/services/product.service';
import { IHeroSlider } from '../../shared/types/hero-slider-t';
import { IProduct } from '../../shared/types/product-d-t';


@Component({
  selector: 'theme-home-four',
  templateUrl: './home-four.component.html',
  styleUrls: ['./home-four.component.scss'],
})

export class HomeFourComponent {
  @ViewChild('heroSliderContainer') heroSliderContainer!: ElementRef;
  public hero_slider_data: IHeroSlider[] = HeroSliderData.hero_slider_four;
  public swiperInstance: Swiper | undefined;

  public trendingProducts: IProduct[] = [];
  public perView: number = 10;

  constructor(private productService: ProductService) {
    this.productService.products.subscribe((products) => {
      this.trendingProducts = products.filter((p) => p.trending);
    });
  }
  // handle per view
  handlePerView() {
    this.perView = this.perView + 4;
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
