import { Component } from '@angular/core';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import seminar_testimonials from 'src/app/shared/utils/data/seminar-testimonials-data';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';

@Component({
  selector: 'app-seminars',
  templateUrl: './seminars.component.html',
  styleUrls: ['./seminars.component.scss']
})
export class SeminarsComponent  {
  public impactDisciplesInfo = impactDisciplesInfo;
  public seminarTestimonials = seminar_testimonials;

  constructor(public utilsService: UtilsService) { }
}