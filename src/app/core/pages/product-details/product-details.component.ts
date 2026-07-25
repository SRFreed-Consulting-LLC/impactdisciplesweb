import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DxValidatorComponent } from 'devextreme-angular';
import { CartItem } from 'impactdisciplescommon/src/models/utils/cart.model';
import { ProductModel } from 'impactdisciplescommon/src/models/utils/product.model';
import { SaleModel } from 'impactdisciplescommon/src/models/utils/sale.model';
import { ProductService } from 'impactdisciplescommon/src/services/data/product.service';
import { SalesService } from 'impactdisciplescommon/src/services/data/sales.service';
import { NumberUtil } from 'impactdisciplescommon/src/utils/number-util';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from 'src/app/shared/utils/services/cart.service';

@Component({
    selector: 'app-product-details',
    templateUrl: './product-details.component.html',
    styleUrls: ['./product-details.component.scss'],
    standalone: false
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('sizeValidator') sizeValidator: DxValidatorComponent;
  @ViewChild('colorValidator') colorValidator: DxValidatorComponent;
  @ViewChild('languageValidator') languageValidator: DxValidatorComponent;

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

  setSize(e) {
    this.cartItem.size = e.selectedItem
  }

  setColor(e) {
    this.cartItem.color = e.selectedItem
  }

  setLanguage(e) {
    this.cartItem.language = e.selectedItem
  }

  addCartProduct() {
    let sizeValid = false;
    let colorValid = false;
    let languageValid = false;

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

    if(this.product.languages && this.product.languages.length > 0){
      languageValid = this.languageValidator.instance.validate().isValid;
    } else {
      languageValid = true;
    }

    if(sizeValid && colorValid && languageValid){
      this.cartService.addCartProduct(this.cartItem);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
