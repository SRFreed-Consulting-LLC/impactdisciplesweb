import { Component, OnInit } from '@angular/core';
import { TestimonialModel } from 'src/app/common/models/domain/testimonial.model';
import { TestimonialService } from 'src/app/common/services/data/testimonial.service';

@Component({
    selector: 'app-customer-reviews',
    templateUrl: './customer-reviews.component.html',
    styleUrls: ['./customer-reviews.component.scss'],
    standalone: false
})
export class CustomerReviewsComponent implements OnInit {

  testimonials: TestimonialModel[] = [];

  // Server-side cap: newest 100 instead of reading the entire growing
  // collection. orderBy(date desc) + limit only -- no composite index needed.
  private readonly maxTestimonials = 100;

  constructor(private testimonialService: TestimonialService){}

  async ngOnInit() {
    await this.testimonialService.getAllOrdered('date', this.maxTestimonials).then(testimonials => this.testimonials = testimonials);
  }

}
