import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss'],
    standalone: false
})
export class BreadcrumbComponent {
  @Input() previousLinkName = '';
  @Input() previousLink = '';
  @Input() previousLinkId = '';
  @Input() currentPageName = '';
  @Input() bgColor = '';
  @Input() bgImg = '';
  @Input() isDark = false;
}
