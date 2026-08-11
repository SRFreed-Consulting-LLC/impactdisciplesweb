import { Component } from '@angular/core';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';
import { MobileMenuModel } from '../../../../../src/app/common/models/utils/nav-menu.model';
import { mobileMenuData } from '../../../../../src/app/common/services/data/nav-menu-data';

@Component({
    selector: 'app-offcanvas',
    templateUrl: './offcanvas.component.html',
    styleUrls: ['./offcanvas.component.scss'],
    standalone: false
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
