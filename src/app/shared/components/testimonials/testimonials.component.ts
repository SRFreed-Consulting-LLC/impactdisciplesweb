import { Component,Input } from '@angular/core';
import Swiper from 'swiper';
import testimonials from '../../utils/data/home-testimonials-data';
import { TestimonialModel } from '../../utils/models/testimonial.model';

@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent {

  @Input() testimonials: TestimonialModel[];

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