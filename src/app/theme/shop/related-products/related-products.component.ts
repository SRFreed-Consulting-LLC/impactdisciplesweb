import { Component, Input } from '@angular/core';
import { ProductService } from '../../shared/services/product.service';
import { IProduct } from '../../shared/types/product-d-t';

@Component({
  selector: 'theme-related-products',
  templateUrl: './related-products.component.html',
  styleUrls: ['./related-products.component.scss'],
})
export class RelatedProductsComponent {
  @Input() productId: number | undefined;
  @Input() brand: string | undefined;
  public related_products: IProduct[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit() {
    if (this.productId && this.brand) {
      this.productService
        .getRelatedProducts(this.productId, this.brand)
        .subscribe((products) => {
          this.related_products = products.slice(0, 4);
        });
    }
  }
}
