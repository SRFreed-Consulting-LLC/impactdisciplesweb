import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProductService } from 'src/app/theme/shared/services/product.service';
import { IProduct } from 'src/app/theme/shared/types/product-d-t';

@Component({
  selector: 'app-dynamic-shop-details',
  templateUrl: './dynamic-shop-details.component.html',
  styleUrls: ['./dynamic-shop-details.component.scss'],
})
export class DynamicShopDetailsComponent {
  public product: IProduct | null | undefined;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const productId = params.get('id');
          if (productId) {
            return this.productService.getProductById(productId);
          }
          return of<IProduct | null>(null); // Emit null if there's no productId
        })
      )
      .subscribe((product: IProduct | null | undefined) => {
        if (!product) {
          // Product not found, navigate to 404 page
          this.router.navigate(['/404']);
        } else {
          this.product = product;
        }
      });
  }
}
