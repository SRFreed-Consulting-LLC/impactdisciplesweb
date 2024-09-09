import { Component } from '@angular/core';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';

@Component({
  selector: 'app-equipping-groups',
  templateUrl: './equipping-groups.component.html',
  styleUrls: ['./equipping-groups.component.scss']
})
export class EquippingGroupsComponent  {
  constructor(public utilsService: UtilsService) { }
}
