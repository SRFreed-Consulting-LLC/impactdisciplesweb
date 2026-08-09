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

  constructor(private testimonialService: TestimonialService){}

  async ngOnInit() {
    await this.testimonialService.getAll().then(testimonials => this.testimonials = testimonials);
  }

}
