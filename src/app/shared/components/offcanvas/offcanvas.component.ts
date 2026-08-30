import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';
import { MenuModel } from '../../../../../src/app/common/models/utils/nav-menu.model';
import { SiteNavigationService } from '../../../../../src/app/common/services/data/site-navigation.service';

@Component({
    selector: 'app-offcanvas',
    templateUrl: './offcanvas.component.html',
    standalone: false
})

export class OffcanvasComponent implements OnInit, OnDestroy {
  // ONE menu, shared with the desktop header (2026-08-29). This used to be
  // `mobileMenuData` - a SECOND hand-maintained array that had drifted from
  // the desktop one with nothing asserting either: its Store was a flat link
  // with no dropdown, so Impact Merchandise could not be reached from a phone
  // at all, and Impact Golf Tournament was missing entirely. Both holes close
  // by rendering the same list the header does.
  //
  // MenuModel, not the deleted MobileMenuModel - and that matters beyond
  // tidiness: MobileMenuModel's children carried only link/title/visible, so
  // even once Impact Merchandise appeared in a mobile dropdown there was no
  // way to mark it as leaving the site, and the template would have tried to
  // route to an off-site URL internally.
  menuItems: MenuModel[] = [];
  activeMenu = "";

  private subscription = new Subscription();

  constructor(
    public utilsService: UtilsService,
    private navigation: SiteNavigationService,
    private router: Router
  ){}

  ngOnInit(): void {
    this.subscription.add(
      this.navigation.menuItems$.subscribe((items) => {
        this.menuItems = items;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  handleOpenMenu(navTitle: string) {
    if (navTitle === this.activeMenu) {
      this.activeMenu = "";
    } else {
      this.activeMenu = navTitle;
    }
  }

  // The same question the desktop header asks, answered the same way: an
  // internal address carrying a query string cannot go through [routerLink],
  // which would treat the whole string as a path.
  // '/store?category=spanish-resources' is a real menu entry.
  //
  // Whether a link LEAVES the site is read from the item's own `external`
  // flag, never sniffed from the URL - staff set it, and a second way of
  // deciding it is a second thing to disagree with.
  hasQuery(link?: string): boolean {
    return !!link && link.includes('?');
  }

  go(event: MouseEvent, link?: string) {
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
    this.utilsService.handleOpenMobileMenu(); // close the drawer behind us
    this.router.navigateByUrl(link);
  }
}
