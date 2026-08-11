import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IMenuType } from 'src/app/shared/utils/models/menu.model';
import { MenuModel } from '../../../../src/app/common/models/utils/nav-menu.model';
import menuData from '../../../../src/app/common/services/data/nav-menu-data';

@Component({
    selector: 'app-nav-menu',
    templateUrl: './nav-menu.component.html',
    styleUrls: ['./nav-menu.component.scss'],
    standalone: false
})
export class NavMenuComponent implements OnInit {
  public menuItems: MenuModel[] = menuData;

  isSummitPosted = false;

  constructor(private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.isSummitPosted = true;
    this.checkForSummit();
  }

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

  checkForSummit() {
    this.menuItems.forEach(menu => {
      if (menu.hasDropdown) {
        menu.dropdownItems.forEach(menuitem => {
          if (menuitem.visible == 'check') {
            menuitem.visible = this.isSummitPosted;
          }
        });
      }
    });
  }
}