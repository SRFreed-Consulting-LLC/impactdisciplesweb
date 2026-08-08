import { Component,Input, OnDestroy, OnInit } from '@angular/core';
import Swiper from 'swiper';
import { Subject, takeUntil } from 'rxjs';
import { TestimonialModel } from 'impactdisciplescommon/src/models/domain/testimonial.model';
import { QueryParam, WhereFilterOperandKeys } from 'impactdisciplescommon/src/dao/firebase.dao';
import { TestimonialService } from 'impactdisciplescommon/src/services/data/testimonial.service';

@Component({
    selector: 'app-testimonials',
    templateUrl: './testimonials.component.html',
    styleUrls: ['./testimonials.component.scss'],
    standalone: false
})
export class TestimonialsComponent implements OnInit, OnDestroy {

  @Input() testimonialType: string

  testimonials: TestimonialModel[] = [];

  private ngUnsubscribe = new Subject<void>();

  constructor(private testimonialService: TestimonialService){}

  ngOnInit(){
    new Swiper(".testimonial__slider-active", {
      slidesPerView: 1,
      spaceBetween: 0,
      pagination:{
        clickable:true,
        el:'.tp-testi-dot'
      }
    });

    let queryParams:QueryParam[] = [
      new QueryParam('type', WhereFilterOperandKeys.equal, this.testimonialType),
      new QueryParam('isActive', WhereFilterOperandKeys.equal, true)
    ];

    this.testimonialService.queryAllStreamByMultiValue(queryParams).pipe(takeUntil(this.ngUnsubscribe)).subscribe(testimonials => this.testimonials = testimonials);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
