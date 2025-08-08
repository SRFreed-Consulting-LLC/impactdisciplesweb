import { Component, OnInit } from '@angular/core';
import { HomePageImageModel } from 'impactdisciplescommon/src/models/domain/home-page-image.model';
import { HomePageImageService } from 'impactdisciplescommon/src/services/data/home-page-images.service';

@Component({
  selector: 'app-home-header-slider',
  templateUrl: './home-header-slider.component.html',
  styleUrls: ['./home-header-slider.component.scss']
})
export class HomeHeaderSliderComponent implements OnInit{
  public images: HomePageImageModel[] = [];

  constructor(private service: HomePageImageService){}

  async ngOnInit() {
    this.images = await this.service.getAllByValue('isActive', true);

    this.images.sort((a,b) => a.order - b.order);
  }
}
