import { Pipe, PipeTransform } from '@angular/core';
import { BlogCategoriesService } from 'impactdisciplescommon/src/services/data/blog-categories.service';
import { ProductCategoriesService } from 'impactdisciplescommon/src/services/data/product-categories.service';

@Pipe({
  name: 'categoryName'
})
export class CategoryNamePipe implements PipeTransform {

  constructor(private blogCategoriesService: BlogCategoriesService, private productCategoriesService: ProductCategoriesService) {}
  transform(id: string, type: string): Promise<string> {
    switch(type) {
      case 'product':
        return this.productCategoriesService.getById(id).then(item => {
          return item.tag
        })
        break;
      case 'blog':
        return this.blogCategoriesService.getById(id).then(item => {
          console.log(item.tag)
          return item.tag
        })
        break;
      default:
        return Promise.resolve('');
        break;
    }
  }
}
