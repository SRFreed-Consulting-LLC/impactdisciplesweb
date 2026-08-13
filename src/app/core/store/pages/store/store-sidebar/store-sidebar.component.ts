import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { SeriesModel } from 'src/app/common/models/utils/series.model';
import { combineLatest, map, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { TagModel } from 'src/app/common/models/domain/tag.model';
import { ProductModel } from 'src/app/common/models/utils/product.model';
import { ProductCategoriesService } from 'src/app/common/services/data/product-categories.service';
import { ProductService } from 'src/app/common/services/data/product.service';
import { QueryParam, WhereFilterOperandKeys } from 'src/app/common/dao/firebase.dao';

interface CategoryWithProducts {
  category: TagModel;
  products: ProductModel[];
  displayProducts: ProductModel[];
}

// Copy of the original store-sidebar.component.ts with one behavior fix:
// category groupings sort by categoryOrder, matching store.component.ts's
// own category filter -- the original sorts by seriesOrder here (a bug
// flagged in the plan, store.component.ts:209 vs store-sidebar.component.ts:60,80).
@Component({
  selector: 'app-store-sidebar',
  templateUrl: './store-sidebar.component.html',
  styleUrls: ['./store-sidebar.component.scss'],
  standalone: false
})
export class StoreSidebarComponent implements OnInit, OnDestroy {
  @Input() showSeriesInSidebar = false;
  @Input() seriesItems: SeriesModel[] = [];
  @Input() ebooksOnly = false;
  @Output() categoryFilterEvent = new EventEmitter<TagModel>();
  @Output() seriesFilterEvent = new EventEmitter<SeriesModel>();
  @Output() searchEvent = new EventEmitter<string>();
  @Output() viewAllProductsEvents = new EventEmitter<void>();

  public categoryWithProducts: CategoryWithProducts[];

  public openIndex: number | null = 0;

  private ngUnsubscribe = new Subject<void>();

  constructor(
    private productService: ProductService,
    private productCategoriesService: ProductCategoriesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const productSource$ = this.ebooksOnly
      ? this.productService.queryAllByMultiValue([new QueryParam('isEBook', WhereFilterOperandKeys.equal, true)])
      : this.productService.streamAllByValue('isActive', true);

    combineLatest([productSource$, this.productCategoriesService.streamAll()]).pipe(
      takeUntil(this.ngUnsubscribe),
      map(([products, categories]) =>
        categories.map(category => {
          const categoryProducts = products
            .filter(product => product.category === category.id)
            .sort((a, b) => (a.categoryOrder ?? 0) - (b.categoryOrder ?? 0));

          return {
            category,
            products: categoryProducts,
            displayProducts: categoryProducts.slice(0, 10)
          };
        })
      )
    ).subscribe(categoryWithProducts => {
      this.categoryWithProducts = this.ebooksOnly
        ? categoryWithProducts.filter(item => item.displayProducts.length > 0)
        : categoryWithProducts;
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

  toggleIndex(index: number): void {
    this.openIndex = this.openIndex === index ? null : index;
  }
}
