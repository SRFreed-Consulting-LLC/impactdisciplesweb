import { Component } from '@angular/core';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';
import { MobileMenuModel } from '../../utils/models/nav-menu.model';
import { mobileMenuData } from '../../utils/data/nav-menu-data';

@Component({
  selector: 'app-offcanvas',
  templateUrl: './offcanvas.component.html',
  styleUrls: ['./offcanvas.component.scss']
})

export class OffcanvasComponent {
  mobileMenuData: MobileMenuModel[] = mobileMenuData;
  activeMenu: string = "";

  constructor(public utilsService: UtilsService){}

  handleOpenMenu(navTitle: string) {
    if (navTitle === this.activeMenu) {
      this.activeMenu = "";
    } else {
      this.activeMenu = navTitle;
    }
  }

}
