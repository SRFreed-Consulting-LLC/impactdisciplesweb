import { Component, Input } from '@angular/core';
import { BlogPostModel } from 'impactdisciplescommon/src/models/domain/blog-post.model';

@Component({
  selector: 'app-blog-postbox-item',
  templateUrl: './blog-postbox-item.component.html',
  styleUrls: ['./blog-postbox-item.component.scss']
})
export class BlogPostboxItemComponent {
  @Input() blog!: BlogPostModel;
}
