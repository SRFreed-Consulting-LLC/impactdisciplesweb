import { ViewportScroller } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WhereFilterOperandKeys, QueryParam } from 'src/app/common/dao/firebase.dao';
import { TagModel } from '@impact-common/shared/models/domain/tag.model';
import { Pager } from 'src/app/common/models/utils/pager.model';
import { ProductModel } from '@impact-common/shared/models/utils/product.model';
import { ProductService } from 'src/app/common/services/data/product.service';
import { ProductCatalogService } from '../../services/product-catalog.service';
import { FilterType } from '../store/store.component';

// Copy of the original e-books.component.ts. Two deliberate, called-out
// improvements now that this shares ProductCatalogService with
// StoreComponent instead of carrying its own copy of getPager()/filter
// logic (the original duplicates that verbatim between the two pages):
//  1. E-books now get active-sale pricing applied, same as /store --
//     the original /e-books never applies sale prices at all, so the same
//     product could show a different price depending which page it's
//     viewed from.
//  2. E-books gains the same A-Z / price sort dropdown /store has,
//     since the underlying logic is shared anyway.
@Component({
  selector: 'app-e-books',
  templateUrl: './e-books.component.html',
  styleUrls: ['./e-books.component.scss'],
  standalone: false
})
export class EBooksComponent implements OnInit, OnDestroy {
  public products: ProductModel[] = [];
  public filteredProductItems: ProductModel[] = [];
  public paginate: Pager = {};
  public pageNo = 1;
  public pageSize = 10;
  public selectedFilter: FilterType = null;
  public FILTER_TYPE = FilterType;
  public filterOptions = [
    { text: 'View All', value: FilterType.viewAll },
    { text: 'A-Z', value: FilterType.aToZ },
    { text: 'Price Low to High', value: FilterType.priceLowToHigh },
    { text: 'Price High to Low', value: FilterType.priceHighToLow }
  ];

  private ngUnsubscribe = new Subject<void>();

  constructor(
    private productService: ProductService,
    private catalog: ProductCatalogService,
    private route: ActivatedRoute,
    private router: Router,
    private viewScroller: ViewportScroller
  ) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.ngUnsubscribe)).subscribe(params => {
      this.pageNo = params['page'] ? params['page'] : this.pageNo;
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.catalog.getActiveSales().then(sales => {
      const queries: QueryParam[] = [new QueryParam('isEBook', WhereFilterOperandKeys.equal, true)];

      this.productService.queryAllByMultiValue(queries).then(products => {
        this.products = products;
        this.catalog.applyActiveProductSale(this.products, sales);
        this.setProducts(this.products);
      });
    });
  }

  setProducts(products: ProductModel[]): void {
    this.paginate = this.catalog.getPager(products.length, Number(+this.pageNo), this.pageSize);
    this.filteredProductItems = products.slice(this.paginate.startIndex, this.paginate.endIndex + 1);
  }

  searchProducts(searchTerm: string): void {
    const termLower = searchTerm.toLowerCase();
    this.setProducts(this.products.filter(product =>
      product?.title?.toLowerCase().includes(termLower) ||
      product?.tags?.some(tag => tag.tag.toLowerCase().includes(termLower))
    ));
  }

  filterProductsByCategory(category: TagModel): void {
    this.setProducts(this.catalog.filterByCategory(this.products, category.id));
  }

  viewAllProducts(): void {
    this.selectedFilter = null;
    this.setProducts([...this.products]);
  }

  showFreeItems(): void {
    this.setProducts(this.products.filter(p => p.cost === 0));
  }

  filterProducts(filterType: FilterType): void {
    this.selectedFilter = filterType;
    switch (filterType) {
      case FilterType.viewAll:
        this.setProducts([...this.products]);
        break;
      case FilterType.aToZ:
        this.setProducts(this.catalog.sortByAZ(this.products));
        break;
      case FilterType.priceLowToHigh:
        this.setProducts(this.catalog.sortByPriceAsc(this.products));
        break;
      case FilterType.priceHighToLow:
        this.setProducts(this.catalog.sortByPriceDesc(this.products));
        break;
    }
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
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
