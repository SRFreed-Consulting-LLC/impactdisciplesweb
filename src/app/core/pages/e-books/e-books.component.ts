import { WhereFilterOperandKeys } from './../../../../../impactdisciplescommon/src/dao/firebase.dao';
import { ViewportScroller } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QueryParam } from 'impactdisciplescommon/src/dao/firebase.dao';
import { TagModel } from 'impactdisciplescommon/src/models/domain/tag.model';
import { ProductModel } from 'impactdisciplescommon/src/models/utils/product.model';
import { SeriesModel } from 'impactdisciplescommon/src/models/utils/series.model';
import { ProductService } from 'impactdisciplescommon/src/services/utils/product.service';
import { SeriesService } from 'impactdisciplescommon/src/services/utils/series.service';

@Component({
  selector: 'app-e-books',
  templateUrl: './e-books.component.html',
  styleUrls: ['./e-books.component.scss']
})
export class EBooksComponent {
  public products: ProductModel[] = [];
  public filteredProductItems: ProductModel[] = [];
  public seriesItems: SeriesModel[] = [];
  public showSeriesInMainView: boolean = false;
  public paginate: any = {};
  public pageNo: number = 1;
  public pageSize: number = 6;

  constructor(
    private productService: ProductService,
    private seriesService: SeriesService,
    private route: ActivatedRoute,
    private router: Router,
    private viewScroller: ViewportScroller
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.pageNo = params['page'] ? params['page'] : this.pageNo;
      this.loadProducts();
    });
  }

  loadProducts(): void {
    let queries: QueryParam[] = [
      new QueryParam('isEBook', WhereFilterOperandKeys.equal, true),
      new QueryParam('isEBook', WhereFilterOperandKeys.equal, true)
    ]

    this.productService.streamAllByValues(queries).subscribe((products) => {
      this.products = products;
      //this.viewBySeries();
      this.paginate = this.getPager(this.products.length, Number(+this.pageNo), this.pageSize);
      this.filteredProductItems = this.products.slice(this.paginate.startIndex, this.paginate.endIndex + 1)
    })
  }

  searchProducts(searchTerm: string): void {
    const termLower = searchTerm.toLowerCase();
    this.filteredProductItems = this.products.filter(
      (product) =>
        product?.title?.toLowerCase().includes(termLower) ||
        product?.tags?.some((tag) => tag.tag.toLowerCase().includes(termLower))
    );
    this.showSeriesInMainView = false;
  }

  filterProductsByCategory(category: TagModel): void {
    this.filteredProductItems = this.products.filter((storeItem) => storeItem.category === category.id);
    this.showSeriesInMainView = false;
  }

  filterProductsBySeries(series: SeriesModel): void {
    this.filteredProductItems = this.products.filter((storeItem) => storeItem.series === series.id);
    this.showSeriesInMainView = false;
  }

  viewAllProducts(): void {
    this.filteredProductItems = [...this.products];
    this.showSeriesInMainView = false;
  }

  viewBySeries(): void {
    this.seriesService.streamAll().subscribe((seriesItems) => {
      this.seriesItems = seriesItems.sort((a, b) => a.order - b.order);
    })
    this.showSeriesInMainView = true;
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
}
