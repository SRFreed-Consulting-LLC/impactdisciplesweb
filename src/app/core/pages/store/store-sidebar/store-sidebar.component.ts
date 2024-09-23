import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ProductModel } from 'impactdisciplescommon/src/models/utils/product.model';
import { SeriesModel } from 'impactdisciplescommon/src/models/utils/series.model';
import { ProductService } from 'impactdisciplescommon/src/services/utils/product.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
  //remove when categories feature works
export interface Category {
  name: string;
}

@Component({
  selector: 'app-store-sidebar',
  templateUrl: './store-sidebar.component.html',
  styleUrls: ['./store-sidebar.component.scss']
})
export class StoreSidebarComponent implements OnInit, OnDestroy {
  @Input() showSeriesInSidebar = false;
  @Input() seriesItems: SeriesModel[] = [];
  @Output() categoryFilterEvent = new EventEmitter<string>();
  @Output() seriesFilterEvent = new EventEmitter<string>();
  @Output() searchEvent = new EventEmitter<string>();
  @Output() viewAllProductsEvents = new EventEmitter<void>();
    //remove when categories feature works
  public categories: Category[] = [
    { name: 'Disciple-Making' },
    { name: 'For Women' },
  ];

  public categoryWithProducts: any;

  private ngUnsubscribe = new Subject<void>();

  constructor(private productService: ProductService, private router: Router) {}

  ngOnInit(): void {
    this.productService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((products) => {
      //remove when categories feature works
      products.forEach((product, index) => {
        const categoryIndex = index % this.categories.length;
        product.category.tag = this.categories[categoryIndex].name;
      });
      this.categoryWithProducts = this.categories.map(category => ({
        category: category.name,
        products: products.filter(product => product.category.tag === category.name)
      }));

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

  onCategoryClick(tag: string): void {
    this.categoryFilterEvent.emit(tag);
  }

  onSeriesClick(tag: string): void {
    this.seriesFilterEvent.emit(tag);
  }

  onItemClick(id: string): void {
    this.router.navigate(['/product-details', id]);
  }
}
