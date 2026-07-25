import { Component, OnInit } from '@angular/core';
import { TestimonialModel } from 'impactdisciplescommon/src/models/domain/testimonial.model';
import { TestimonialService } from 'impactdisciplescommon/src/services/data/testimonial.service';

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
