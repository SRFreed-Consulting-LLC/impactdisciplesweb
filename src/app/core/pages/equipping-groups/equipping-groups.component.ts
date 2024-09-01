import { Component } from '@angular/core';
import equipping_groups_testimonials from 'src/app/shared/utils/data/equipping-groups-testimonials-data';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';

@Component({
  selector: 'app-equipping-groups',
  templateUrl: './equipping-groups.component.html',
  styleUrls: ['./equipping-groups.component.scss']
})
export class EquippingGroupsComponent  {

  public equippingGroupsTestimonials = equipping_groups_testimonials;

  constructor(public utilsService: UtilsService) { }
}