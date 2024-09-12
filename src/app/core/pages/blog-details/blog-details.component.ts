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

  constructor(private route: ActivatedRoute, private blogPostService: BlogPostService) {
    this.blogPostService.streamAll().subscribe((blogs) => {
      
      const related_blogs = blogs.filter(blog => (blog?.subject === this.blog?.subject) && (blog?.id !== this.blog?.id));
      const otherBlogs = blogs.filter(blog => blog?.id !== this.blog?.id);
      console.log(related_blogs)
      related_blogs.length > 0
      ? this.relatedBlogs = related_blogs.slice(0, 2)
      : this.relatedBlogs = otherBlogs.slice(0, 2)
    
    })
  }

  ngOnInit(): void {
    const blogId = this.route.snapshot.paramMap.get('id');
    if (blogId) {
      this.blogPostService.streamById(blogId).pipe(takeUntil(this.ngUnsubscribe)).subscribe((blog) => {
        this.blog = blog;
      })
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
