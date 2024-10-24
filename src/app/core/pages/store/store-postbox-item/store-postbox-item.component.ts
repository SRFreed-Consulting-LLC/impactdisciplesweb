import { Component, Input } from '@angular/core';
import { CartItem } from 'impactdisciplescommon/src/models/utils/cart.model';
import { ProductModel } from 'impactdisciplescommon/src/models/utils/product.model';
import { NumberUtil } from 'impactdisciplescommon/src/utils/number-util';
import { CartService } from 'src/app/shared/utils/services/cart.service';

@Component({
  selector: 'app-store-postbox-item',
  templateUrl: './store-postbox-item.component.html',
  styleUrls: ['./store-postbox-item.component.scss']
})
export class StorePostboxItemComponent {
  @Input() product: ProductModel;
  cartItem: CartItem;

  constructor(public cartService: CartService) {}

  addCartProduct() {
    this.cartItem = {
      id: this.product.id,
      itemName: this.product.title,
      orderQuantity: 1,
      price: NumberUtil.isNumber(this.product.cost)? this.product.cost : 0,
      img: this.product.imageUrl,
      isEvent: false,
      isEBook: this.product.isEBook,
      weight: this.product.weight,
      uom: this.product.uom,
      eBookUrl: this.product.eBookUrl? this.product.eBookUrl : null
    }
    this.cartService.addCartProduct(this.cartItem)
  }
}
