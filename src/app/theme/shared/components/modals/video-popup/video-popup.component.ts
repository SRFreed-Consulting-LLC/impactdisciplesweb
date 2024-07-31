import { Component } from '@angular/core';
import { UtilsService } from '../../../services/utils.service';

@Component({
  selector: 'app-video-popup',
  templateUrl: './video-popup.component.html',
  styleUrls: ['./video-popup.component.scss']
})
export class VideoPopupComponent {

  constructor(public utilsService: UtilsService){}

}
