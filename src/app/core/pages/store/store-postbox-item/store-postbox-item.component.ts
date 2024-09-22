import { Component, Input } from '@angular/core';
import { ProductModel } from 'impactdisciplescommon/src/models/utils/product.model';

@Component({
  selector: 'app-store-postbox-item',
  templateUrl: './store-postbox-item.component.html',
  styleUrls: ['./store-postbox-item.component.scss']
})
export class StorePostboxItemComponent {
  @Input() product: ProductModel;
}
