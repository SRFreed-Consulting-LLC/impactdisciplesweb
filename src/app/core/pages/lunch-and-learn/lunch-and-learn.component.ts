import { Component } from '@angular/core';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';

@Component({
    selector: 'app-lunch-and-learn',
    templateUrl: './lunch-and-learn.component.html',
    styleUrls: ['./lunch-and-learn.component.scss'],
    standalone: false
})
export class LunchAndLearnComponent  {
  isPlaying: boolean = false;

  constructor(public utilsService: UtilsService) { }

  playVideo(){
    this.isPlaying = true;
  }
}