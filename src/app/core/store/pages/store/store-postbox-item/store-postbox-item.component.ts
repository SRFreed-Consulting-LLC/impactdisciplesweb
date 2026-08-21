import { Component, Input } from '@angular/core';
import { ProductModel } from '@impact-common/shared/models/utils/product.model';
import { CartService } from '../../../services/cart.service';
import { ProductCatalogService } from '../../../services/product-catalog.service';

// Copy of the original store-postbox-item.component.ts, but the CartItem
// construction now goes through ProductCatalogService.productToCartItem()
// instead of being built inline here -- the original duplicates this same
// construction (with slightly different field coverage) in both this
// component and product-details.component.ts; store's two equivalents
// share the one mapper instead.
@Component({
  selector: 'app-store-postbox-item',
  templateUrl: './store-postbox-item.component.html',
  styleUrls: ['./store-postbox-item.component.scss'],
  standalone: false
})
export class StorePostboxItemComponent {
  @Input() product: ProductModel;

  constructor(public cartService: CartService, private catalog: ProductCatalogService) {}

  addCartProduct(): void {
    this.cartService.addCartProduct(this.catalog.productToCartItem(this.product));
  }
}
