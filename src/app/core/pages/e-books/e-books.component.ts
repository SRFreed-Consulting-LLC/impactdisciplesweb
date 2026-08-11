import { WhereFilterOperandKeys } from './../../../../../src/app/common/dao/firebase.dao';
import { ViewportScroller } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QueryParam } from 'src/app/common/dao/firebase.dao';
import { TagModel } from 'src/app/common/models/domain/tag.model';
import { ProductModel } from 'src/app/common/models/utils/product.model';
import { SeriesModel } from 'src/app/common/models/utils/series.model';
import { ProductService } from 'src/app/common/services/data/product.service';
import { SeriesService } from 'src/app/common/services/data/series.service';

@Component({
    selector: 'app-e-books',
    templateUrl: './e-books.component.html',
    styleUrls: ['./e-books.component.scss'],
    standalone: false
})
export class EBooksComponent {
  public products: ProductModel[] = [];
  public filteredProductItems: ProductModel[] = [];
  public seriesItems: SeriesModel[] = [];
  public showSeriesInMainView: boolean = false;
  public paginate: any = {};
  public pageNo: number = 1;
  public pageSize: number = 10;

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
    ]

    this.productService.queryAllByMultiValue(queries).then((products) => {
      this.products = products;
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
    this.paginate = this.getPager(this.filteredProductItems.length, Number(+this.pageNo), this.pageSize);
    this.filteredProductItems = this.filteredProductItems.slice(this.paginate.startIndex, this.paginate.endIndex + 1);
  }

  viewAllProducts(): void {
    this.filteredProductItems = [...this.products];
    this.paginate = this.getPager(this.filteredProductItems.length, Number(+this.pageNo), this.pageSize);
    this.filteredProductItems = this.filteredProductItems.slice(this.paginate.startIndex, this.paginate.endIndex + 1);
  }

  showFreeItems(): void {
    this.filteredProductItems = this.products.filter((storeItem) => storeItem.cost === 0);
    this.paginate = this.getPager(this.filteredProductItems.length, Number(+this.pageNo), this.pageSize);
    this.filteredProductItems = this.filteredProductItems.slice(this.paginate.startIndex, this.paginate.endIndex + 1);
  }

  showDiscipleMakingSeries(): void {

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