import { Component } from '@angular/core';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent  {
  constructor(public utilsService: UtilsService) { }
}
