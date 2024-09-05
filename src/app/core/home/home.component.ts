import { Component } from '@angular/core';
import home_testimonials from 'src/app/shared/utils/data/home-testimonials-data';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  isPlaying: boolean = false;

  public homeTestimonials = home_testimonials;

  constructor() { }

  playVideo(){
    this.isPlaying = true;
  }
}
