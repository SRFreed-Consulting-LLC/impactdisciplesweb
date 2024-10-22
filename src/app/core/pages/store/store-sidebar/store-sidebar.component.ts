import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { SeriesModel } from 'impactdisciplescommon/src/models/utils/series.model';
import { combineLatest, map, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { TagModel } from 'impactdisciplescommon/src/models/domain/tag.model';
import { ProductCategoriesService } from 'impactdisciplescommon/src/services/data/product-categories.service';
import { ProductService } from 'impactdisciplescommon/src/services/data/product.service';

@Component({
  selector: 'app-store-sidebar',
  templateUrl: './store-sidebar.component.html',
  styleUrls: ['./store-sidebar.component.scss']
})
export class StoreSidebarComponent implements OnInit, OnDestroy {
  @Input() showSeriesInSidebar = false;
  @Input() seriesItems: SeriesModel[] = [];
  @Output() categoryFilterEvent = new EventEmitter<TagModel>();
  @Output() seriesFilterEvent = new EventEmitter<SeriesModel>();
  @Output() searchEvent = new EventEmitter<string>();
  @Output() viewAllProductsEvents = new EventEmitter<void>();

  public categoryWithProducts: any;

  private ngUnsubscribe = new Subject<void>();

  constructor(private productService: ProductService, private productCategoriesService: ProductCategoriesService, private router: Router) {}

  ngOnInit(): void {
    combineLatest([
      this.productService.streamAllByValue('isActive', true),
      this.productCategoriesService.streamAll()
    ]).pipe(
      takeUntil(this.ngUnsubscribe),
      map(([products, categories]) =>
        categories.map(category => {
          const categoryProducts = products.filter(product => product.category === category.id).sort((a,b) => a.title.localeCompare(b.title));

          return {
            category: category,
            products: categoryProducts,
            displayProducts: categoryProducts.slice(0, 10)
          };
        })
      )
    ).subscribe(categoryWithProducts => {
      this.categoryWithProducts = categoryWithProducts;
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  onSearch(searchTerm: string): void {
    this.searchEvent.emit(searchTerm);
  }

  onSearchInputChange(value: string): void {
    if (value === '') {
      this.onViewAllProducts();
    }
  }

  onViewAllProducts(): void {
    this.viewAllProductsEvents.emit();
  }

  onCategoryClick(category: TagModel): void {
    this.categoryFilterEvent.emit(category);
  }

  onSeriesClick(series: SeriesModel): void {
    this.seriesFilterEvent.emit(series);
  }

  onItemClick(id: string): void {
    this.router.navigate(['/product-details', id]);
  }
}
