import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { BlogPostModel } from 'impactdisciplescommon/src/models/domain/blog-post.model';
import { BlogPostService } from 'impactdisciplescommon/src/services/blog-post.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-blog-sidebar',
  templateUrl: './blog-sidebar.component.html',
  styleUrls: ['./blog-sidebar.component.scss']
})
export class BlogSidebarComponent implements OnInit, OnDestroy {
  @Output() tagFilterEvent = new EventEmitter<string>();
  @Output() searchEvent = new EventEmitter<string>();
  @Output() clearFiltersEvent = new EventEmitter<void>();
  public recent_blogs: BlogPostModel[] = [];
  public subjectsWithTags: { subject: string, tags: string[] }[] = [];

  private ngUnsubscribe = new Subject<void>();

  constructor(private blogPostService: BlogPostService) {}

  ngOnInit(): void {
    this.blogPostService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((blogs) => {
      this.recent_blogs = blogs.slice(-3); 
      this.buildSubjectsWithTags(blogs);   
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

  onTagClick(tag: string): void {
    this.tagFilterEvent.emit(tag);
  }

  onClearFilters(): void {
    this.clearFiltersEvent.emit();
  }

  private buildSubjectsWithTags(blogs: BlogPostModel[]): void {
    const subjectTagMap = new Map<string, Set<string>>();
    blogs.forEach((blog) => {
      if (blog.subject) {
        if (!subjectTagMap.has(blog.subject)) {
          subjectTagMap.set(blog.subject, new Set<string>());
        }
        blog.tags?.forEach((tag) => subjectTagMap.get(blog.subject)?.add(tag));
      }
    });

    this.subjectsWithTags = Array.from(subjectTagMap.entries()).map(([subject, tags]) => ({
      subject,
      tags: Array.from(tags),
    }));
  }
}
