import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import category_data from 'src/app/theme/shared/data/category-data';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';
import { ICategoryType } from 'src/app/theme/shared/types/category-d-t';


@Component({
  selector: 'theme-category-filter',
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.scss'],
})
export class CategoryFilterComponent {
  public categoryData: ICategoryType[] = category_data;;
  public category: string | null = null;
  public subcategory: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public utilsService: UtilsService
  ) {
    this.route.queryParams.subscribe((params) => {
      this.category = params['category'] ? params['category'] : null;
      this.subcategory = params['subcategory'] ? params['subcategory'] : null;
    });
  }

  public handleParentCategory(categoryValue: string): void {
    const currentQueryParams = this.route.snapshot.queryParams; // Get current query parameters
    const queryParams = {
      ...currentQueryParams, // Keep the existing query parameters
      category: this.utilsService.convertToURL(categoryValue),
    };
    this.router.navigate(['/shop'], { queryParams });
  }

  public handleSubCategory(subcategoryValue: string): void {
    const currentQueryParams = this.route.snapshot.queryParams; // Get current query parameters
    const queryParams = {
      ...currentQueryParams, // Keep the existing query parameters
      subcategory: this.utilsService.convertToURL(subcategoryValue),
    };
    this.router.navigate(['/shop'], { queryParams });
  }
}
