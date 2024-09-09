import { Component } from '@angular/core';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';

@Component({
  selector: 'app-seminars',
  templateUrl: './seminars.component.html',
  styleUrls: ['./seminars.component.scss']
})
export class SeminarsComponent  {
  public impactDisciplesInfo = impactDisciplesInfo;

  constructor(public utilsService: UtilsService) { }
}
