import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { SeriesModel } from 'src/app/common/models/utils/series.model';
import { combineLatest, map, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { TagModel } from 'src/app/common/models/domain/tag.model';
import { ProductCategoriesService } from 'src/app/common/services/data/product-categories.service';
import { ProductService } from 'src/app/common/services/data/product.service';
import { QueryParam, WhereFilterOperandKeys } from 'src/app/common/dao/firebase.dao';

@Component({
    selector: 'app-store-sidebar',
    templateUrl: './store-sidebar.component.html',
    styleUrls: ['./store-sidebar.component.scss'],
    standalone: false
})
export class StoreSidebarComponent implements OnInit, OnDestroy {
  @Input() showSeriesInSidebar = false;
  @Input() seriesItems: SeriesModel[] = [];
  @Input() ebooksOnly: boolean = false;
  @Output() categoryFilterEvent = new EventEmitter<TagModel>();
  @Output() seriesFilterEvent = new EventEmitter<SeriesModel>();
  @Output() searchEvent = new EventEmitter<string>();
  @Output() viewAllProductsEvents = new EventEmitter<void>();

  public categoryWithProducts: any;

  // Replaces DxAccordion's [collapsible]="true" [multiple]="false" -- one
  // category open at a time, clicking the open one closes it. 0 to match
  // DevExtreme's own default selectedIndex (first item open on load).
  public openIndex: number | null = 0;

  private ngUnsubscribe = new Subject<void>();

  constructor(
    private productService: ProductService,
    private productCategoriesService: ProductCategoriesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.ebooksOnly) {
      const queries: QueryParam[] = [
        new QueryParam('isEBook', WhereFilterOperandKeys.equal, true)
      ];

      combineLatest([
        this.productService.queryAllByMultiValue(queries),
        this.productCategoriesService.streamAll()
      ]).pipe(
          takeUntil(this.ngUnsubscribe),
          map(([products, categories]) =>
            categories.map(category => {
              const categoryProducts = products.filter(product => product.category === category.id).sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));

              return {
                category: category,
                products: categoryProducts,
                displayProducts: categoryProducts.slice(0, 10)
              };
            })
          )
        ).subscribe(categoryWithProducts => {
          this.categoryWithProducts = categoryWithProducts.filter((item) => item.displayProducts.length > 0);
        });
    } else {
      combineLatest([
        this.productService.streamAllByValue('isActive', true),
        this.productCategoriesService.streamAll()
      ]).pipe(
          takeUntil(this.ngUnsubscribe),
          map(([products, categories]) =>
            categories.map(category => {
              const categoryProducts = products.filter(product => product.category === category.id).sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));

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
