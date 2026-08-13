import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartItem } from 'src/app/common/models/utils/cart.model';
import { ProductModel } from 'src/app/common/models/utils/product.model';
import { SaleModel } from 'src/app/common/models/utils/sale.model';
import { ProductService } from 'src/app/common/services/data/product.service';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { ProductCatalogService } from '../../services/product-catalog.service';

// Copy of the original product-details.component.ts. The duplicated
// getActiveSales()/sale-price logic and the CartItem construction both now
// come from ProductCatalogService instead of being reimplemented here.
@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss'],
  standalone: false
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  sizeError = false;
  colorError = false;
  languageError = false;

  product: ProductModel;
  cartItem: CartItem;
  public relatedProducts: ProductModel[] = [];

  NumberUtil = NumberUtil;

  private ngUnsubscribe = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    public cartService: CartService,
    private catalog: ProductCatalogService
  ) {}

  ngOnInit(): void {
    this.catalog.getActiveSales().then(sales => {
      this.route.params.pipe(takeUntil(this.ngUnsubscribe)).subscribe(params => {
        const productId = params['id'];
        if (productId) {
          this.loadProductDetails(productId, sales);
        }
      });
    });
  }

  private loadProductDetails(productId: string, sales: SaleModel[]): void {
    this.productService.streamById(productId).pipe(takeUntil(this.ngUnsubscribe)).subscribe(products => {
      this.product = products[0];

      // streamById() can emit an empty array -- briefly while the first
      // real snapshot is still in flight, or permanently for a bad/deleted
      // product id -- leaving this.product undefined. Both
      // applyActiveProductSale() and productToCartItem() below dereference
      // it immediately, so this isn't optional.
      if (!this.product) {
        return;
      }

      this.catalog.applyActiveProductSale([this.product], sales);
      this.cartItem = this.catalog.productToCartItem(this.product);

      this.productService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe(allProducts => {
        const relatedByCategory = allProducts.filter(p => p?.category === this.product?.category && p?.id !== this.product?.id);
        const otherProducts = allProducts.filter(p => p?.id !== this.product?.id);
        this.relatedProducts = relatedByCategory.length > 0 ? relatedByCategory.slice(0, 2) : otherProducts.slice(0, 2);
      });
    });
  }

  increment(): void {
    this.cartItem.orderQuantity = this.cartItem.orderQuantity + 1;
  }

  decrement(): void {
    if (this.cartItem.orderQuantity > 1) {
      this.cartItem.orderQuantity = this.cartItem.orderQuantity - 1;
    }
  }

  setSize(value: string): void {
    this.cartItem.size = value;
    this.sizeError = false;
  }

  setColor(value: string): void {
    this.cartItem.color = value;
    this.colorError = false;
  }

  setLanguage(value: string): void {
    this.cartItem.language = value;
    this.languageError = false;
  }

  addCartProduct(): void {
    const sizeValid = !(this.product.sizes?.length > 0) || !!this.cartItem.size;
    const colorValid = !(this.product.colors?.length > 0) || !!this.cartItem.color;
    const languageValid = !(this.product.languages?.length > 0) || !!this.cartItem.language;

    this.sizeError = !sizeValid;
    this.colorError = !colorValid;
    this.languageError = !languageValid;

    if (sizeValid && colorValid && languageValid) {
      this.cartService.addCartProduct(this.cartItem, this.cartItem.orderQuantity);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
