import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartItem } from 'impactdisciplescommon/src/models/utils/cart.model';
import { ProductModel } from 'impactdisciplescommon/src/models/utils/product.model';
import { ProductService } from 'impactdisciplescommon/src/services/utils/product.service';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from 'src/app/shared/utils/services/cart.service';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  product: ProductModel;
  cartItem: CartItem;
  public relatedProducts: ProductModel[] = [];

  private ngUnsubscribe = new Subject<void>();

  constructor(private route: ActivatedRoute, private productService: ProductService, public cartService: CartService) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.ngUnsubscribe)).subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProductDetails(productId);
      }
    });
  }

  private loadProductDetails(productId: string): void {
    this.productService.streamById(productId).pipe(takeUntil(this.ngUnsubscribe)).subscribe((product) => {
      this.product = product;
      this.cartItem = {
        id: product.id,
        itemName: product.title,
        orderQuantity: 1,
        price: this.isNan(product.cost)? product.cost : 0,
        img: product.imageUrl,
        isEvent: false,
        isEBook: product.isEBook,
        eBookUrl: product.eBookUrl?product.eBookUrl:null
      }

      this.productService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((products) => {
        const related_products = products.filter(p => (p?.category === this.product?.category) && (p?.id !== this.product?.id));
        const otherProducts = products.filter(b => b?.id !== this.product?.id);

        this.relatedProducts = related_products.length > 0 ? related_products.slice(0, 2) : otherProducts.slice(0, 2);
      });
    });
  }

  increment() {
    this.cartItem.orderQuantity = this.cartItem.orderQuantity + 1;
  }

  decrement() {
    if (this.cartItem.orderQuantity > 1) {
      this.cartItem.orderQuantity = this.cartItem.orderQuantity - 1;
    }
  }

  addCartProduct() {
    this.cartService.addCartProduct(this.cartItem)
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public isNan(value){
    if(Number.isNaN(value)){
      return false
    } else {
      return true;
    }
  }
}
