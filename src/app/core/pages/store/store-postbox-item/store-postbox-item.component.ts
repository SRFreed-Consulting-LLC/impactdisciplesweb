import { Component, Input } from '@angular/core';
import { CartItem } from 'src/app/common/models/utils/cart.model';
import { ProductModel } from 'src/app/common/models/utils/product.model';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { CartService } from 'src/app/shared/utils/services/cart.service';

@Component({
    selector: 'app-store-postbox-item',
    templateUrl: './store-postbox-item.component.html',
    styleUrls: ['./store-postbox-item.component.scss'],
    standalone: false
})
export class StorePostboxItemComponent {
  @Input() product: ProductModel;
  cartItem: CartItem;

  constructor(public cartService: CartService) {}

  addCartProduct() {
    this.cartItem = {
      id: this.product.id,
      itemName: this.product?.title,
      orderQuantity: 1,
      price: NumberUtil.isNumber(this.product.cost)? this.product.cost : 0,
      salePrice: this.product.salePrice,
      img: this.product.imageUrl,
      isEvent: false,
      isEBook: this.product.isEBook ? this.product.isEBook : false,
      isDigitalBook: this.product.isDigitalBook? this.product.isDigitalBook: false,
      weight: this.product.weight,
      uom: this.product.uom,
      eBookUrl: this.product.eBookUrl? this.product.eBookUrl : null,
      followUpEmailId: this.product.sendFollowUpEmail && this.product.followUpEmailId ? this.product.followUpEmailId : ''
    }
    this.cartService.addCartProduct(this.cartItem)
  }
}
