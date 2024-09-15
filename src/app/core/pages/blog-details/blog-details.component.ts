import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogPostModel } from 'impactdisciplescommon/src/models/domain/blog-post.model';
import { BlogPostService } from 'impactdisciplescommon/src/services/blog-post.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-blog-details',
  templateUrl: './blog-details.component.html',
  styleUrls: ['./blog-details.component.scss']
})
export class BlogDetailsComponent implements OnInit, OnDestroy {
  blog: BlogPostModel;
  public relatedBlogs: BlogPostModel[] = [];

  private ngUnsubscribe = new Subject<void>();

  constructor(private route: ActivatedRoute, private blogPostService: BlogPostService) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.ngUnsubscribe)).subscribe(params => {
      const blogId = params['id'];
      if (blogId) {
        this.loadBlogDetails(blogId);
      }
    });
  }

  private loadBlogDetails(blogId: string): void {
    this.blogPostService.streamById(blogId).pipe(takeUntil(this.ngUnsubscribe)).subscribe((blog) => {
      this.blog = blog;

      this.blogPostService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((blogs) => {
        const related_blogs = blogs.filter(b => (b?.subject === this.blog?.subject) && (b?.id !== this.blog?.id));
        const otherBlogs = blogs.filter(b => b?.id !== this.blog?.id);

        this.relatedBlogs = related_blogs.length > 0 ? related_blogs.slice(0, 2) : otherBlogs.slice(0, 2);
      });
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
