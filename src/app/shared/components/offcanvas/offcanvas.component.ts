import { Component } from '@angular/core';
import { Router } from '@angular/router';
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
  activeMenu = "";

  constructor(public utilsService: UtilsService, private router: Router) {}

  // The drawer's groups are native <details>, so the element handles its own
  // open state; this only tracks which one we consider current so the template
  // can keep exactly one expanded at a time.
  handleOpenMenu(navTitle: string) {
    this.activeMenu = navTitle === this.activeMenu ? "" : navTitle;
  }

  // Same reason as the desktop nav: a link carrying a query string can't be
  // handed to routerLink as one string.
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
