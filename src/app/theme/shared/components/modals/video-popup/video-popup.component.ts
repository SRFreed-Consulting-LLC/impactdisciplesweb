import { Component } from '@angular/core';
import { UtilsService } from '../../../services/utils.service';

@Component({
    selector: 'theme-video-popup',
    templateUrl: './video-popup.component.html',
    styleUrls: ['./video-popup.component.scss'],
    standalone: false
})
export class VideoPopupComponent {

  constructor(public utilsService: UtilsService){}

}
