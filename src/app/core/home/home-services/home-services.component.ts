import { Component } from '@angular/core';
import services from 'src/app/shared/utils/data/home-services-data';
import { HomeServicesModel } from 'src/app/shared/utils/models/home-services.model';
import category_data from 'src/app/theme/shared/data/category-data';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';
import { ICategoryType } from 'src/app/theme/shared/types/category-d-t';

@Component({
  selector: 'app-home-services',
  templateUrl: './home-services.component.html',
  styleUrls: ['./home-services.component.scss']
})
export class HomeServicesComponent {

  public services: HomeServicesModel[] = services;

  constructor(public utilsService: UtilsService){}
}