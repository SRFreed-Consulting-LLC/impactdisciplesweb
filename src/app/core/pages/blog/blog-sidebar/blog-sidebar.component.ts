import { BlogTagsService } from './../../../../../../impactdisciplescommon/src/services/blog-tags.service';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { BlogPostModel } from 'impactdisciplescommon/src/models/domain/blog-post.model';
import { TagModel } from 'impactdisciplescommon/src/models/domain/tag.model';
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
  public subjectsWithTags: { subject: string, tags: TagModel[] }[] = [];

  blogTags: TagModel[]

  private ngUnsubscribe = new Subject<void>();

  constructor(private blogPostService: BlogPostService, private blogTagsService: BlogTagsService) {}

  ngOnInit(): void {
    this.blogPostService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((blogs) => {
      this.recent_blogs = blogs.slice(-3);
      this.buildSubjectsWithTags(blogs);
    });

    this.blogTagsService.streamAll().subscribe(tags => {
      this.blogTags = tags;
    })
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
    const subjectTagMap = new Map<string, Set<TagModel>>();
    blogs.forEach((blog) => {
      if (blog.subject) {
        if (!subjectTagMap.has(blog.subject)) {
          subjectTagMap.set(blog.subject, new Set<TagModel>());
        }
        blog.tags?.forEach((tag) => subjectTagMap.get(blog.subject)?.add(tag));
      }
    });

    this.subjectsWithTags = Array.from(subjectTagMap.entries()).map(([subject, tags]) => ({
      subject,
      tags: Array.from(tags),
    }));
  }

  getTagNameById(id: string){
    let tag: TagModel = this.blogTags?.find(tag => tag.id === id);
    if(tag){
      return tag.tag
    }

    return '';
  }
}
