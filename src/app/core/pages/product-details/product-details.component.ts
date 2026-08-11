import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartItem } from 'src/app/common/models/utils/cart.model';
import { ProductModel } from 'src/app/common/models/utils/product.model';
import { SaleModel } from 'src/app/common/models/utils/sale.model';
import { ProductService } from 'src/app/common/services/data/product.service';
import { SalesService } from 'src/app/common/services/data/sales.service';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from 'src/app/shared/utils/services/cart.service';

@Component({
    selector: 'app-product-details',
    templateUrl: './product-details.component.html',
    styleUrls: ['./product-details.component.scss'],
    standalone: false
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  // Set true (and shown as an inline "X is required" message) only after a
  // failed addCartProduct() attempt -- replaces DxValidator's required-rule
  // behavior, which validated on demand via .instance.validate() the same way.
  sizeError = false;
  colorError = false;
  languageError = false;

  product: ProductModel;
  cartItem: CartItem;
  public relatedProducts: ProductModel[] = [];

  NumberUtil = NumberUtil

  private ngUnsubscribe = new Subject<void>();

  constructor(private route: ActivatedRoute, private productService: ProductService, public cartService: CartService, private salesService: SalesService,) {}

  ngOnInit(): void {
    this.getActiveSales().then(sales => {
      this.route.params.pipe(takeUntil(this.ngUnsubscribe)).subscribe(params => {
        const productId = params['id'];

        if (productId) {
          this.loadProductDetails(productId, sales);
        }
      });
    })
  }

  async getActiveSales() {
    return this.salesService.getAllByValue("isActive", true).then(sales => {
      let retval: SaleModel[] = [];

      let today = new Date();

      sales.forEach(sale => {
        let startDate = new Date(sale.startDate as string)

        let endDate = new Date(sale.endDate as string)

        if(startDate.getTime() <= today.getTime() && endDate.getTime() >= today.getTime()){
          retval.push(sale);
        }
      })

      return retval;
    })
  }

  private loadProductDetails(productId: string, sales: SaleModel[]): void {
    this.productService.streamById(productId).pipe(takeUntil(this.ngUnsubscribe)).subscribe((product) => {
      this.product = product[0];
      console.log('adding product',)

      this.cartItem = {
        id: this.product?.id,
        itemName: this.product?.title,
        orderQuantity: 1,
        price: NumberUtil.isNumber(this.product?.cost)? this?.product.cost : 0,
        salePrice: NumberUtil.isNumber(this.product?.salePrice)? this.product?.salePrice : 0,
        img: this.product?.imageUrl,
        isEvent: false,
        isEBook: this.product?.isEBook ? this.product?.isEBook : false,
        isDigitalBook: this.product?.isDigitalBook? this.product?.isDigitalBook: false,
        digitalBookId: this.product?.digitalBookId? this.product?.digitalBookId : '',
        eBookUrl: this.product?.eBookUrl ? this.product?.eBookUrl:null,
        weight: this.product?.weight ? this.product?.weight: 0,
        followUpEmailId: this.product.sendFollowUpEmail && this.product.followUpEmailId ? this.product.followUpEmailId : ''
      }

      this.checkProductForSale(sales);

      this.productService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((products) => {
        const related_products = products.filter(p => (p?.category === this.product?.category) && (p?.id !== this.product?.id));
        const otherProducts = products.filter(b => b?.id !== this.product?.id);

        this.relatedProducts = related_products.length > 0 ? related_products.slice(0, 2) : otherProducts.slice(0, 2);
      });
    });
  }

  checkProductForSale(sales: SaleModel[]){
    let selectedSale: SaleModel;

    sales.forEach(sale => {
      if(sale.isProducts){
        selectedSale = sale;
      }
    })

    if(selectedSale){
      this.product.salePrice = this.product.cost - (selectedSale.percentOff / 100 * this.product.cost)
      this.cartItem.salePrice = this.cartItem.price - (selectedSale.percentOff / 100 * this.cartItem.price)
    }
  }

  increment() {
    this.cartItem.orderQuantity = this.cartItem.orderQuantity + 1;
  }

  decrement() {
    if (this.cartItem.orderQuantity > 1) {
      this.cartItem.orderQuantity = this.cartItem.orderQuantity - 1;
    }
  }

  setSize(value: string) {
    this.cartItem.size = value;
    this.sizeError = false;
  }

  setColor(value: string) {
    this.cartItem.color = value;
    this.colorError = false;
  }

  setLanguage(value: string) {
    this.cartItem.language = value;
    this.languageError = false;
  }

  addCartProduct() {
    const sizeValid = !(this.product.sizes?.length > 0) || !!this.cartItem.size;
    const colorValid = !(this.product.colors?.length > 0) || !!this.cartItem.color;
    const languageValid = !(this.product.languages?.length > 0) || !!this.cartItem.language;

    this.sizeError = !sizeValid;
    this.colorError = !colorValid;
    this.languageError = !languageValid;

    if(sizeValid && colorValid && languageValid){
      this.cartService.addCartProduct(this.cartItem);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
