import { Component, Input } from '@angular/core';
import { IProduct } from '../../shared/types/product-d-t';
import { CartService } from '../../shared/services/cart.service';
import { UtilsService } from '../../shared/services/utils.service';


@Component({
  selector: 'theme-product-item-two',
  templateUrl: './product-item-two.component.html',
  styleUrls: ['./product-item-two.component.scss']
})
export class ProductItemTwoComponent {
  @Input() product!: IProduct;

  constructor(
    public cartService: CartService,
    public utilsService: UtilsService,
  ) {}

  // add to cart
  addToCart(item: IProduct) {
    this.cartService.addCartProduct(item);
  }
  // Function to check if an item is in the cart
  isItemInCart(item: IProduct): boolean {
    return this.cartService.getCartProducts().some((prd: IProduct) => prd.id === item.id);
  }
}
