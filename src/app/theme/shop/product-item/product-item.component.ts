import { Component,Input } from '@angular/core';
import { CartService } from '../../shared/services/cart.service';
import { CompareService } from '../../shared/services/compare.service';
import { UtilsService } from '../../shared/services/utils.service';
import { WishlistService } from '../../shared/services/wishlist.service';
import { IProduct } from '../../shared/types/product-d-t';


@Component({
  selector: 'app-product-item',
  templateUrl: './product-item.component.html',
  styleUrls: ['./product-item.component.scss']
})
export class ProductItemComponent {
  @Input() product!: IProduct;

  constructor(
    public cartService: CartService,
    public wishlistService: WishlistService,
    public compareService: CompareService,
    public utilsService: UtilsService,
  ) {}

  // add to cart
  addToCart(item: IProduct) {
    this.cartService.addCartProduct(item);
  }

   // add to cart
   addToWishlist(product: IProduct) {
    this.wishlistService.add_wishlist_product(product);
  }

  // add to cart
  addToCompare(product: IProduct) {
    this.compareService.add_compare_product(product);
  }

  // Function to check if an item is in the cart
  isItemInCart(item: IProduct): boolean {
    return this.cartService.getCartProducts().some((prd: IProduct) => prd.id === item.id);
  }
  isItemInWishlist(item: IProduct): boolean {
    return this.wishlistService.getWishlistProducts().some((prd: IProduct) => prd.id === item.id);
  }
  isItemInCompare(item: IProduct): boolean {
    return this.compareService.getCompareProducts().some((prd: IProduct) => prd.id === item.id);
  }

}
