import { TestimonialService } from './../../../../../impactdisciplescommon/src/services/utils/testimonial.service';
import { Component,Input, OnInit } from '@angular/core';
import Swiper from 'swiper';
import { TestimonialModel } from 'impactdisciplescommon/src/models/domain/testimonial.model';

@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent implements OnInit{

  @Input() testimonialType: string

  testimonials: TestimonialModel[] = [];

  constructor(private testimonialService: TestimonialService){}

  async ngOnInit (){
    new Swiper(".testimonial__slider-active", {
      slidesPerView: 1,
      spaceBetween: 0,
      pagination:{
        clickable:true,
        el:'.tp-testi-dot'
      }
    });

    this.testimonials = await this.testimonialService.getAllByValue('type', this.testimonialType);
  }

}
