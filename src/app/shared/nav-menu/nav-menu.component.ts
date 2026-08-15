import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenuModel } from '../../../../src/app/common/models/utils/nav-menu.model';
import menuData from '../../../../src/app/common/services/data/nav-menu-data';

@Component({
    selector: 'app-nav-menu',
    templateUrl: './nav-menu.component.html',
    styleUrls: ['./nav-menu.component.scss'],
    standalone: false
})
export class NavMenuComponent {
  public menuItems: MenuModel[] = menuData;

  constructor(private router: Router) {}

  // `/store?category=spanish-resources` can't go through routerLink as a single
  // string -- the router would treat the query string as part of the path -- so
  // those entries render as a plain href and navigate through the router here
  // instead, keeping it a client-side navigation rather than a full reload.
  hasQuery(link?: string): boolean {
    return !!link && link.includes('?');
  }

  go(event: MouseEvent, link?: string): void {
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
    this.router.navigateByUrl(link);
  }
}
