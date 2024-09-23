import { BlogTagsService } from './../../../../../../impactdisciplescommon/src/services/blog-tags.service';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BlogPostModel } from 'impactdisciplescommon/src/models/domain/blog-post.model';
import { TagModel } from 'impactdisciplescommon/src/models/domain/tag.model';
import { BlogPostService } from 'impactdisciplescommon/src/services/blog-post.service';
import { BlogCategoriesService } from 'impactdisciplescommon/src/services/utils/blog-categories.service';
import { combineLatest, map, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-blog-sidebar',
  templateUrl: './blog-sidebar.component.html',
  styleUrls: ['./blog-sidebar.component.scss']
})
export class BlogSidebarComponent implements OnInit, OnDestroy {
  @Output() categoryFilterEvent = new EventEmitter<TagModel>();
  @Output() searchEvent = new EventEmitter<string>();
  @Output() clearFiltersEvent = new EventEmitter<void>();
  public recent_blogs: BlogPostModel[] = [];
  public categoryWithBlogs: any;

  private ngUnsubscribe = new Subject<void>();

  constructor(private blogPostService: BlogPostService, private blogTagsService: BlogTagsService, private blogCategoriesService: BlogCategoriesService, private router: Router) {}

  ngOnInit(): void {
    combineLatest([
      this.blogPostService.streamAll(),
      this.blogCategoriesService.streamAll()
    ]).pipe(
      takeUntil(this.ngUnsubscribe),
      map(([blogs, categories]) => {
        this.recent_blogs = blogs.slice(-3);
        return categories.map(category => {
          const categoryBlogs = blogs.filter(blog => blog.category === category.id);
          
          return {
            category: category,
            blogs: categoryBlogs,
            displayProducts: categoryBlogs.slice(0, 10)
          };
        })
      })
    ).subscribe(categoryWithBlogs => {
      this.categoryWithBlogs = categoryWithBlogs;
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
      this.onClearFilters();  // Call clearFilter when input is cleared
    }
  }

  onCategoryClick(category: TagModel): void {
    this.categoryFilterEvent.emit(category);
  }

  onClearFilters(): void {
    this.clearFiltersEvent.emit();
  }

  onItemClick(id: string): void {
    this.router.navigate(['/blog-details', id]);
  }
}
