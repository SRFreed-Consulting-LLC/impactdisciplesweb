import { Component,Input } from '@angular/core';
import Swiper from 'swiper';

@Component({
  selector: 'app-client-slider',
  templateUrl: './client-slider.component.html',
  styleUrls: ['./client-slider.component.scss']
})
export class ClientSliderComponent {

  @Input() style_2 : Boolean = false;
  // client logos
  public client_logos = [
    '/assets/img/client/client-1.jpg',
    '/assets/img/client/client-2.jpg',
    '/assets/img/client/client-3.jpg',
    '/assets/img/client/client-4.jpg',
    '/assets/img/client/client-5.jpg',
    '/assets/img/client/client-4.jpg',
    '/assets/img/client/client-2.jpg',
  ]

  ngAfterViewInit() {
    // client slider
    new Swiper('.client__slider', {
      slidesPerView: 5,
      spaceBetween: 0,
      loop: false,
      breakpoints: {
        '1200': {
          slidesPerView: 5,
        },
        '992': {
          slidesPerView: 3,
        },
        '768': {
          slidesPerView: 2,
        },
        '576': {
          slidesPerView: 1,
        },
        '0': {
          slidesPerView: 1,
        },
      },
    })
  }

}
