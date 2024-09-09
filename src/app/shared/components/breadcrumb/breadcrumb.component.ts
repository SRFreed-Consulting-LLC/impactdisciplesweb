import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent {
  @Input() previousLinkName: string = '';
  @Input() previousLink: string = '';
  @Input() previousLinkId: string = '';
  @Input() currentPageName: string = '';
  @Input() bgImg: string = '';
  @Input() isDark: boolean = false;
}
