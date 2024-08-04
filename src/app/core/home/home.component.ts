import { Component } from '@angular/core';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  constructor(public utilsService: UtilsService) { }
}