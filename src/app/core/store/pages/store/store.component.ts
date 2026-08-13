import { ViewportScroller } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TagModel } from 'src/app/common/models/domain/tag.model';
import { Pager } from 'src/app/common/models/utils/pager.model';
import { ProductModel } from 'src/app/common/models/utils/product.model';
import { SeriesModel } from 'src/app/common/models/utils/series.model';
import { ProductService } from 'src/app/common/services/data/product.service';
import { SeriesService } from 'src/app/common/services/data/series.service';
import { ProductCatalogService } from '../../services/product-catalog.service';

export enum FilterType {
  viewAll = 0,
  viewBySeries = 1,
  aToZ = 2,
  priceLowToHigh = 3,
  priceHighToLow = 4,
  category = 5,
  series = 6
}

// store's browse page. Same conceptual behavior as the original
// store.component.ts (browse / filter / search / paginate active products,
// apply an active sale's price where relevant) but the pager, active-sale
// lookup, and CartItem construction all now come from the shared
// ProductCatalogService instead of being reimplemented here -- see the
// plan's Services section. The original store.component.ts/e-books.component.ts
// are untouched; this is a self-contained copy-and-refactor, not an edit.
@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss'],
  standalone: false
})
export class StoreComponent implements OnInit, OnDestroy {
  public products: ProductModel[] = [];
  public filteredProductItems: ProductModel[] = [];
  public seriesItems: SeriesModel[] = [];
  public showSeriesInMainView = true;
  public paginate: Pager = {};
  public pageNo = 1;
  public pageSize = 10;
  public selectedFilter: FilterType = null;
  public FILTER_TYPE = FilterType;
  public filterOptions = [
    { text: 'View All', value: FilterType.viewAll },
    { text: 'View by Series', value: FilterType.viewBySeries },
    { text: 'A-Z', value: FilterType.aToZ },
    { text: 'Price Low to High', value: FilterType.priceLowToHigh },
    { text: 'Price High to Low', value: FilterType.priceHighToLow }
  ];
  // Matches the original store.component.ts exactly (same hardcoded id,
  // same single-slug special case) for behavioral parity -- moving this to
  // WebConfigModel is tracked as optional Phase 5 polish in the plan, not
  // done here since store's job is a faithful side-by-side comparison,
  // not silently changing what /store?category=spanish-resources does.
  SPANISH_CATEGORY_ID = '18z0BtelKIKrwycvko9N';

  private ngUnsubscribe = new Subject<void>();

  constructor(
    private productService: ProductService,
    private seriesService: SeriesService,
    private catalog: ProductCatalogService,
    private route: ActivatedRoute,
    private router: Router,
    private viewScroller: ViewportScroller
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['page']) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          queryParamsHandling: '',
          replaceUrl: true
        });
      }
    });

    this.route.queryParamMap.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      if (this.products?.length) {
        this.applyCategoryFromUrl();
      }
    });

    this.catalog.getActiveSales().then(sales => {
      this.productService.streamAllByValue('isActive', true).pipe(takeUntil(this.ngUnsubscribe)).subscribe(products => {
        this.products = products;
        this.catalog.applyActiveProductSale(this.products, sales);
        this.applyCategoryFromUrl();
      });
    });
  }

  // These four -- the sidebar's direct actions -- paginate inline against
  // the *current* pageNo instead of going through setProducts()/setPage().
  // That's deliberate, not an oversight: setPage() navigates with a `page`
  // query param, which re-fires this component's own queryParamMap
  // subscription (ngOnInit) and calls applyCategoryFromUrl() again --
  // since none of these four actions correspond to a `?category=...` URL,
  // that second call resets showSeriesInMainView back to true, silently
  // undoing the very click that just set it false. The original
  // store.component.ts avoids this the same way (its viewAllProducts/
  // filterProductsByCategory/filterProductsBySeries/showFreeItems all
  // paginate inline too) -- only searchProducts() and the FilterType
  // switch's aToZ/price/category/series branches go through setProducts().
  viewAllProducts(): void {
    this.showSeriesInMainView = false;
    this.paginateInline([...this.products]);
  }

  filterProductsByCategory(category: TagModel): void {
    this.showSeriesInMainView = false;
    this.paginateInline(this.catalog.filterByCategory(this.products, category.id));
  }

  filterProductsBySeries(series: SeriesModel): void {
    this.showSeriesInMainView = false;
    this.paginateInline(this.catalog.filterBySeries(this.products, series.id));
  }

  // The header's button used to filter this page in place to free items
  // (showFreeItems()); now it navigates to /e-books instead -- same
  // destination the removed "E-Books" link went to -- since e-books has
  // its own "FREE E-BOOKS" filter button for narrowing further there.
  goToEbooks(): void {
    this.router.navigateByUrl('/e-books');
  }

  private paginateInline(products: ProductModel[]): void {
    this.paginate = this.catalog.getPager(products.length, Number(+this.pageNo), this.pageSize);
    this.filteredProductItems = products.slice(this.paginate.startIndex, this.paginate.endIndex + 1);
  }

  setProducts(products: ProductModel[]): void {
    this.filteredProductItems = products;
    this.setPage(1);
    this.route.queryParams.pipe(takeUntil(this.ngUnsubscribe)).subscribe(params => {
      this.pageNo = params['page'] ? params['page'] : this.pageNo;
      this.paginate = this.catalog.getPager(products.length, Number(+this.pageNo), this.pageSize);
      this.filteredProductItems = products.slice(this.paginate.startIndex, this.paginate.endIndex + 1);
    });
  }

  searchProducts(searchTerm: string): void {
    this.selectedFilter = null;
    const termLower = searchTerm.toLowerCase();
    const results = this.products.filter(product =>
      product?.title?.toLowerCase().includes(termLower) ||
      product?.tags?.some(tag => tag.tag.toLowerCase().includes(termLower))
    ).sort((a, b) => a.title.localeCompare(b.title));

    this.showSeriesInMainView = false;
    this.setProducts(results);
  }

  filterProducts(filterType: FilterType, filterItem?: { id?: string }): void {
    this.showSeriesInMainView = false;
    switch (filterType) {
      case FilterType.viewAll:
        this.selectedFilter = FilterType.viewAll;
        this.viewAllProducts();
        break;
      case FilterType.viewBySeries:
        this.selectedFilter = FilterType.viewBySeries;
        this.seriesService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe(seriesItems => {
          this.seriesItems = seriesItems.sort((a, b) => a.order - b.order);
        });
        this.showSeriesInMainView = true;
        break;
      case FilterType.aToZ:
        this.selectedFilter = FilterType.aToZ;
        this.setProducts(this.catalog.sortByAZ(this.products));
        break;
      case FilterType.priceLowToHigh:
        this.selectedFilter = FilterType.priceLowToHigh;
        this.setProducts(this.catalog.sortByPriceAsc(this.products));
        break;
      case FilterType.priceHighToLow:
        this.selectedFilter = FilterType.priceHighToLow;
        this.setProducts(this.catalog.sortByPriceDesc(this.products));
        break;
      case FilterType.category:
        this.selectedFilter = null;
        this.setProducts(this.catalog.filterByCategory(this.products, filterItem.id));
        break;
      case FilterType.series:
        this.selectedFilter = null;
        this.setProducts(this.catalog.filterBySeries(this.products, filterItem.id));
        break;
    }
  }

  applyCategoryFromUrl(): void {
    const category = this.route.snapshot.queryParamMap.get('category');

    if (category === 'spanish-resources') {
      this.filterProductsByCategory({ tag: 'Spanish Resources', id: this.SPANISH_CATEGORY_ID } as TagModel);
      return;
    }

    this.selectedFilter = null;
    this.showSeriesInMainView = true;
    this.filterProducts(FilterType.viewBySeries);
  }

  setPage(page: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
      skipLocationChange: false
    }).finally(() => this.viewScroller.setOffset([120, 120]));
  }

  ngOnDestroy(): void {
    this.showSeriesInMainView = true;
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
