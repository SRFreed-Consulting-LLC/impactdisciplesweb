import { Component,Input } from '@angular/core';
import category_data from '../../shared/data/category-data';
import { UtilsService } from '../../shared/services/utils.service';
import { ICategoryType } from '../../shared/types/category-d-t';


@Component({
  selector: 'theme-shop-category',
  templateUrl: './shop-category.component.html',
  styleUrls: ['./shop-category.component.scss']
})
export class ShopCategoryComponent {
  @Input() style_2:Boolean = false;
  @Input() style_3:Boolean = false;
  @Input() style_4:Boolean = false;
  @Input() shop_category_2:Boolean = false;
  public category_data:ICategoryType[] = category_data;

  constructor(public utilsService:UtilsService){}
}
