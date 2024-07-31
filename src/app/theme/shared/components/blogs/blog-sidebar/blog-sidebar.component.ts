import { Component } from '@angular/core';
import IBlogType from '../../../types/blog-d-t';
import { UtilsService } from '../../../services/utils.service';

@Component({
  selector: 'app-blog-sidebar',
  templateUrl: './blog-sidebar.component.html',
  styleUrls: ['./blog-sidebar.component.scss']
})
export class BlogSidebarComponent {

  public recent_blogs: IBlogType[] = [];

  constructor(public utilsService:UtilsService){
    this.utilsService.blogs.subscribe((blogs) => {
      this.recent_blogs = blogs.slice(-3)
    });
  }

}
