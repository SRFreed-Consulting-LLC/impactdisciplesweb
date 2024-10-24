import { ViewportScroller } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TagModel } from 'impactdisciplescommon/src/models/domain/tag.model';
import { ProductModel } from 'impactdisciplescommon/src/models/utils/product.model';
import { SeriesModel } from 'impactdisciplescommon/src/models/utils/series.model';
import { ProductService } from 'impactdisciplescommon/src/services/data/product.service';
import { SeriesService } from 'impactdisciplescommon/src/services/data/series.service';
import { Subject, takeUntil } from 'rxjs';

export enum FilterType {
  viewAll = 0,
  viewBySeries = 1,
  aToZ = 2,
  priceLowToHigh = 3,
  priceHighToLow = 4,
  category = 5,
  series = 6
}

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss']
})
export class StoreComponent implements OnInit, OnDestroy {
  public products: ProductModel[] = [];
  public filteredProductItems: ProductModel[] = [];
  public seriesItems: SeriesModel[] = [];
  public showSeriesInMainView: boolean = true;
  public paginate: any = {};
  public pageNo: number = 1;
  public pageSize: number = 6;
  public selectedFilter: FilterType;
  public FILTER_TYPE = FilterType;
  public filterOptions = [
    { text: 'View All', value: FilterType.viewAll },
    { text: 'View by Series', value: FilterType.viewBySeries },
    { text: 'A-Z', value: FilterType.aToZ },
    { text: 'Price Low to High', value: FilterType.priceLowToHigh },
    { text: 'Price High to Low', value: FilterType.priceHighToLow }
  ];

  private ngUnsubscribe = new Subject<void>();

  constructor(
    private productService: ProductService,
    private seriesService: SeriesService,
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
    this.productService.streamAllByValue('isActive', true).subscribe((products) => {
      this.products = products;

      if(!this.showSeriesInMainView) {
        this.setProducts(this.products)
      } else {
        this.filterProducts(FilterType.viewBySeries)
      }
    })
  }

  setProducts(products: ProductModel[]) {
    this.setPage(1)
    this.route.queryParams.pipe(takeUntil(this.ngUnsubscribe)).subscribe((params) => {
      this.pageNo = params['page'] ? params['page'] : this.pageNo;
      this.paginate = this.getPager(products.length, Number(+this.pageNo), this.pageSize);
      this.filteredProductItems = products.slice(this.paginate.startIndex, this.paginate.endIndex + 1)
    })
  }

  searchProducts(searchTerm: string): void {
    this.selectedFilter = null;
    const termLower = searchTerm.toLowerCase();
    this.filteredProductItems = this.products.filter(
      (product) =>
        product?.title?.toLowerCase().includes(termLower) ||
        product?.tags?.some((tag) => tag.tag.toLowerCase().includes(termLower))
    ).sort((a,b) => a.title.localeCompare(b.title));
    this.showSeriesInMainView = false;
    this.setProducts(this.filteredProductItems);
    
  }

  filterProducts(filterType: FilterType, filterItem?: any) {
    this.showSeriesInMainView = false;
    switch(filterType) {
      case FilterType.viewAll:
        this.selectedFilter = FilterType.viewAll;
        this.setProducts(this.products)
        break;
      case FilterType.viewBySeries:
        this.selectedFilter = FilterType.viewBySeries;
        this.seriesService.streamAll().subscribe((seriesItems) => {
          this.seriesItems = seriesItems.sort((a, b) => a.order - b.order);
        })
        this.showSeriesInMainView = true;
        break;
      case FilterType.aToZ:
        this.filteredProductItems = [...this.products.sort((a, b) => a.title.localeCompare(b.title))];
        this.setProducts(this.filteredProductItems);
        break;
      case FilterType.priceLowToHigh:
        this.filteredProductItems = [...this.products.sort((a, b) => {
          if (a.cost == null) return -1;
          if (b.cost == null) return 1;
          return a.cost - b.cost;
        })];
        this.setProducts(this.filteredProductItems);
        break;
      case FilterType.priceHighToLow:
        this.filteredProductItems = [...this.products.sort((a, b) => b.cost - a.cost)];
        this.setProducts(this.filteredProductItems);
        break;
      case FilterType.category:
        this.selectedFilter = null;
        this.filteredProductItems = this.products.filter((storeItem) => storeItem.category === filterItem.id).sort((a,b) => a.title.localeCompare(b.title));
        this.setProducts(this.filteredProductItems);
        break;
      case FilterType.series:
        this.selectedFilter = null;
        this.filteredProductItems = this.products.filter((storeItem) => storeItem.series === filterItem.id).sort((a,b) => a.title.localeCompare(b.title));
        this.setProducts(this.filteredProductItems);
        break;
    }
  }

  setPage(page: number) {
    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: { page: page },
        queryParamsHandling: 'merge',
        skipLocationChange: false,
      })
      .finally(() => {
        this.viewScroller.setOffset([120, 120]);
      });
  }

  getPager(totalItems: number, currentPage: number = 1, pageSize: number = 9) {
    // calculate total pages
    let totalPages = Math.ceil(totalItems / pageSize);

    // Paginate Range
    let paginateRange = 3;

    // ensure current page isn't out of range
    if (currentPage < 1) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    let startPage: number, endPage: number;
    if (totalPages <= 5) {
      startPage = 1;
      endPage = totalPages;
    } else if(currentPage < paginateRange - 1){
      startPage = 1;
      endPage = startPage + paginateRange - 1;
    } else {
      startPage = currentPage - 1;
      endPage =  currentPage + 1;
    }

    // calculate start and end item indexes
    let startIndex = (currentPage - 1) * pageSize;
    let endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

    // create an array of pages to ng-repeat in the pager control
    let pages = Array.from(Array((endPage + 1) - startPage).keys()).map(i => startPage + i);

    // return object with all pager properties required by the view
    return {
      totalItems: totalItems,
      currentPage: currentPage,
      pageSize: pageSize,
      totalPages: totalPages,
      startPage: startPage,
      endPage: endPage,
      startIndex: startIndex,
      endIndex: endIndex,
      pages: pages
    };
  }

  ngOnDestroy(): void {
    this.showSeriesInMainView = true;
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
