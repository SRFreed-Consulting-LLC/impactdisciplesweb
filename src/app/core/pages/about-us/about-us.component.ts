import { Component } from '@angular/core';

@Component({
    selector: 'app-about-us',
    templateUrl: './about-us.component.html',
    styleUrls: ['./about-us.component.scss'],
    standalone: false
})
export class AboutUsComponent  {
  isPlaying = false;

  playVideo(){
    this.isPlaying = true;
  }
}
