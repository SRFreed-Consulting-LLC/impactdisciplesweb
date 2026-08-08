import { Component } from '@angular/core';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';

@Component({
    selector: 'app-coaching-with-impact',
    templateUrl: './coaching-with-impact.component.html',
    styleUrls: ['./coaching-with-impact.component.scss'],
    standalone: false
})
export class CoachingWithImpactComponent  {
  constructor(public utilsService: UtilsService) { }
}