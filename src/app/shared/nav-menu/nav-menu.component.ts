import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IMenuType } from 'src/app/shared/utils/models/menu.model';
import { MenuModel } from '../../../../src/app/common/models/utils/nav-menu.model';
import menuData from '../../../../src/app/common/services/data/nav-menu-data';

@Component({
    selector: 'app-nav-menu',
    templateUrl: './nav-menu.component.html',
    standalone: false
})
export class NavMenuComponent {
  public menuItems: MenuModel[] = menuData;

  constructor(private router: Router) {}

  hasQuery(link?: string): boolean {
    return !!link && link.includes('?');
  }

  go(event: MouseEvent, link?: string) {
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
    this.router.navigateByUrl(link);
  }

  getMenuClasses(item: IMenuType): string {
    const classes = [];
    if (item.hasDropdown && !item.megamenu) {
      classes.push('active', 'has-dropdown');
    } else if (item.megamenu) {
      classes.push('mega-menu', 'has-dropdown');
    }
    return classes.join(' ');
  }
}
