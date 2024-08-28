import { Component } from '@angular/core';
import services from 'src/app/shared/utils/data/home-services-data';
import { HomeServicesModel } from 'src/app/shared/utils/models/home-services.model';

@Component({
  selector: 'app-home-services',
  templateUrl: './home-services.component.html',
  styleUrls: ['./home-services.component.scss']
})
export class HomeServicesComponent {
  public services: HomeServicesModel[] = services;
}