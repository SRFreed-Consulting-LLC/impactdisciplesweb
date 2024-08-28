import { Component,Input } from '@angular/core';
import Swiper from 'swiper';
import testimonials from '../../utils/data/testimonials-data';

@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent {

  public testimonials = testimonials;

  ngOnInit (){
    new Swiper(".testimonial__slider-active", {
      slidesPerView: 1,
      spaceBetween: 0,
      pagination:{
        clickable:true,
        el:'.tp-testi-dot'
      }
    });
  }

}