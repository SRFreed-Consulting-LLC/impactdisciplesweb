import { Component } from '@angular/core';
import home_testimonials from 'src/app/shared/utils/data/home-testimonials-data';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  public homeTestimonials = home_testimonials;

  constructor(public utilsService: UtilsService) { }
}