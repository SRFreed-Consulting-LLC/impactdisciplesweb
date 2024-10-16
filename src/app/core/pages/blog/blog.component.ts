import { ViewportScroller } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogPostModel } from 'impactdisciplescommon/src/models/domain/blog-post.model';
import { TagModel } from 'impactdisciplescommon/src/models/domain/tag.model';
import { BlogPostService } from 'impactdisciplescommon/src/services/data/blog-post.service';
import { BlogTagsService } from 'impactdisciplescommon/src/services/data/blog-tags.service';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {
  public blogs: BlogPostModel[] = [];
  public filteredBlogs: BlogPostModel[] = [];
  public pageSize: number = 6;
  public paginate: any = {};
  public sortBy: string = 'asc';
  public pageNo: number = 1;
  public impactDisciplesInfo = impactDisciplesInfo;

  blogTags: TagModel[];

  constructor(
    private blogPostService: BlogPostService,
    private blogTagService: BlogTagsService,
    private route: ActivatedRoute,
    private router: Router,
    private viewScroller: ViewportScroller
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.pageNo = params['page'] ? params['page'] : this.pageNo;
      this.loadBlogs();
    });

    this.blogTagService.streamAll().subscribe(tags =>{
      this.blogTags = tags;
    })
  }

  loadBlogs(): void {
    this.blogPostService.streamAllByValue('isActive', true).subscribe((blogs) => {
      this.blogs = blogs.sort((a, b) => new Date(b?.date?.toString()).getTime() - new Date(a?.date?.toString()).getTime());
      this.paginate = this.getPager(this.blogs.length, Number(+this.pageNo), this.pageSize);
      this.filteredBlogs = this.blogs.slice(this.paginate.startIndex, this.paginate.endIndex + 1);
    });
  }

  searchBlogs(searchTerm: string): void {
    const termLower = searchTerm.toLowerCase();
    this.filteredBlogs = this.blogs.filter(
      (blog) =>
        blog.category?.toLowerCase().includes(termLower) ||
        blog.tags?.some((tag) => tag.tag.toLowerCase().includes(termLower)) ||
        blog.date.toString().includes(termLower) ||
        blog.title.toLocaleLowerCase().includes(termLower)
    );
    this.paginate = this.getPager(this.filteredBlogs.length, Number(+this.pageNo), this.pageSize);

  }

  filterBlogsByCategory(category: TagModel): void {
    this.filteredBlogs = this.blogs.filter((blog) => blog.category === category.id);
  }

  clearFilters(): void {
    this.loadBlogs()
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
