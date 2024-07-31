import { Component,Input } from '@angular/core';
import IBlogType from '../../../types/blog-d-t';


@Component({
  selector: 'app-blog-item',
  templateUrl: './blog-item.component.html',
  styleUrls: ['./blog-item.component.scss']
})
export class BlogItemComponent {
  @Input() blog!:IBlogType
}
