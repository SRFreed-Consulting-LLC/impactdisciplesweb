import { Component, OnDestroy, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TagModel } from '@impact-common/shared/models/domain/tag.model';
import { ProductModel } from '@impact-common/shared/models/utils/product.model';
import { SeriesModel } from '@impact-common/shared/models/utils/series.model';
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
// store.component.ts (browse / filter / search active products, apply an
// active sale's price where relevant) but the active-sale lookup and
// CartItem construction come from the shared ProductCatalogService instead
// of being reimplemented here -- see the plan's Services section. The
// original store.component.ts/e-books.component.ts are untouched; this is
// a self-contained copy-and-refactor, not an edit.
//
// No pagination here (by design - see user request to remove store
// paging): the full filtered/sorted list renders in one view.
// e-books.component.ts still uses ProductCatalogService.getPager() for its
// own page, untouched by this.
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
  public selectedFilter: FilterType = null;
  public FILTER_TYPE = FilterType;
  // Display text deliberately drops "View"/"View by" (e.g. "View All" ->
  // "All") - the dropdown now has its own "Sort By" label doing that job,
  // see store.component.html.
  public filterOptions = [
    { text: 'All', value: FilterType.viewAll },
    { text: 'Series', value: FilterType.viewBySeries },
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

  constructor(
    private productService: ProductService,
    private seriesService: SeriesService,
    private catalog: ProductCatalogService,
    private route: ActivatedRoute,
    private router: Router,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    // Legacy cleanup - an old bookmarked/shared link from when this page
    // paginated (?page=N) just gets the stray param stripped now; nothing
    // reads it anymore.
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['page']) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          queryParamsHandling: '',
          replaceUrl: true
        });
      }
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.products?.length) {
        this.applyCategoryFromUrl();
      }
    });

    this.catalog.getActiveOffers().then(offers => {
      this.productService.streamAllByValue('isActive', true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(products => {
        this.products = products;
        this.catalog.applyActiveOffers(this.products, offers);
        this.applyCategoryFromUrl();
      });
    });
  }

  // These four -- the sidebar's direct actions -- assign the filtered list
  // straight to filteredProductItems instead of going through
  // setProducts(). That's deliberate, not an oversight: setProducts() used
  // to navigate with a `page` query param before pagination was removed,
  // which re-fired this component's own queryParamMap subscription
  // (ngOnInit) and called applyCategoryFromUrl() again -- since none of
  // these four actions correspond to a `?category=...` URL, that second
  // call resets showSeriesInMainView back to true, silently undoing the
  // very click that just set it false. Kept these four separate (rather
  // than folding them back into setProducts() now that it no longer
  // navigates) to preserve that same safety margin. The original
  // store.component.ts avoids the same class of bug the same way (its
  // viewAllProducts/filterProductsByCategory/filterProductsBySeries/
  // showFreeItems are all direct assignments too) -- only searchProducts()
  // and the FilterType switch's aToZ/price/category/series branches go
  // through setProducts().
  viewAllProducts(): void {
    this.showSeriesInMainView = false;
    this.selectedFilter = FilterType.viewAll;
    this.filteredProductItems = [...this.products];
  }

  filterProductsByCategory(category: TagModel): void {
    this.showSeriesInMainView = false;
    this.filteredProductItems = this.catalog.filterByCategory(this.products, category.id);
  }

  filterProductsBySeries(series: SeriesModel): void {
    this.showSeriesInMainView = false;
    this.filteredProductItems = this.catalog.filterBySeries(this.products, series.id);
  }

  // The header's button used to filter this page in place to free items
  // (showFreeItems()); now it navigates to /e-books instead -- same
  // destination the removed "E-Books" link went to -- since e-books has
  // its own "FREE E-BOOKS" filter button for narrowing further there.
  goToEbooks(): void {
    this.router.navigateByUrl('/e-books');
  }

  setProducts(products: ProductModel[]): void {
    this.filteredProductItems = products;
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
        this.seriesService.streamAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(seriesItems => {
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

  ngOnDestroy(): void {
    this.showSeriesInMainView = true;
  }
}
