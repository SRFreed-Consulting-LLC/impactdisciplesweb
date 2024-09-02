import { Component } from '@angular/core';
import impactDisciplesInfo from '../utils/data/impact-disciples.data';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  public impactDisciplesInfo = impactDisciplesInfo;
}