import { Component } from '@angular/core';
import { IMenuType } from 'src/app/theme/shared/types/menu-d-t';
import { MenuModel } from '../utils/models/nav-menu.model';
import menuData from '../utils/data/nav-menu-data';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.scss']
})
export class NavMenuComponent {
  public menuItems: MenuModel[] = menuData;

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