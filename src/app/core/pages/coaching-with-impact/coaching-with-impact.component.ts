import { Component } from '@angular/core';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';

@Component({
  selector: 'app-coaching-with-impact',
  templateUrl: './coaching-with-impact.component.html',
  styleUrls: ['./coaching-with-impact.component.scss']
})
export class CoachingWithImpactComponent  {
  constructor(public utilsService: UtilsService) { }
}