import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DxValidatorComponent } from 'devextreme-angular';
import { CartItem } from 'impactdisciplescommon/src/models/utils/cart.model';
import { ProductModel } from 'impactdisciplescommon/src/models/utils/product.model';
import { ProductService } from 'impactdisciplescommon/src/services/data/product.service';
import { NumberUtil } from 'impactdisciplescommon/src/utils/number-util';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from 'src/app/shared/utils/services/cart.service';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('sizeValidator') sizeValidator: DxValidatorComponent;
  @ViewChild('colorValidator') colorValidator: DxValidatorComponent;

  product: ProductModel;
  cartItem: CartItem;
  public relatedProducts: ProductModel[] = [];

  NumberUtil = NumberUtil

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
      this.product = product[0];
      this.cartItem = {
        id: this.product.id,
        itemName: this.product.title,
        orderQuantity: 1,
        price: NumberUtil.isNumber(this.product.cost)? this.product.cost : 0,
        img: this.product.imageUrl,
        isEvent: false,
        isEBook: this.product.isEBook ? this.product.isEBook : false,
        eBookUrl: this.product.eBookUrl ? this.product.eBookUrl:null,
        weight: this.product.weight ? this.product.weight: 0
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

  setSize(e) {
    this.cartItem.size = e.selectedItem
  }

  setColor(e) {
    this.cartItem.color = e.selectedItem
  }

  addCartProduct() {
    let sizeValid = false;
    let colorValid = false;

    if(this.product.sizes && this.product.sizes.length > 0){
      sizeValid = this.sizeValidator.instance.validate().isValid;
    } else {
      sizeValid = true;
    }

    if(this.product.colors && this.product.colors.length > 0){
      colorValid = this.colorValidator.instance.validate().isValid;
    } else {
      colorValid = true;
    }

    if(sizeValid && colorValid){
      this.cartService.addCartProduct(this.cartItem);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
