import { Component, OnInit } from '@angular/core';
import { IMenuType } from 'src/app/theme/shared/types/menu-d-t';
import { MenuModel } from '../../../../impactdisciplescommon/src/models/utils/nav-menu.model';
import menuData from '../../../../impactdisciplescommon/src/services/data/nav-menu-data';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.scss']
})
export class NavMenuComponent implements OnInit{
  public menuItems: MenuModel[] = menuData;

  isSummitPosted: boolean = false;

  constructor(){}

  async ngOnInit(): Promise<void> {
    this.isSummitPosted = true;

    this.checkForSummit();
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

  checkForSummit(){
    this.menuItems.forEach(menu => {
      if(menu.hasDropdown){
        menu.dropdownItems.forEach(menuitem => {
          if(menuitem.visible == 'check'){
            menuitem.visible = this.isSummitPosted;
          }
        })
      }
    })
  }
}
