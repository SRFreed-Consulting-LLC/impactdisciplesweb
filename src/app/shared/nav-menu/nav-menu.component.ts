import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IMenuType } from 'src/app/shared/utils/models/menu.model';
import { MenuModel } from '../../../../src/app/common/models/utils/nav-menu.model';
import { SiteNavigationService } from '../../../../src/app/common/services/data/site-navigation.service';

@Component({
    selector: 'app-nav-menu',
    templateUrl: './nav-menu.component.html',
    standalone: false
})
export class NavMenuComponent implements OnInit, OnDestroy {
  // Was `menuData` imported straight from nav-menu-data.ts. It now comes from
  // Firestore so staff can edit the menu without a deploy, and so the mobile
  // menu renders the SAME list instead of its own hand-maintained copy - see
  // SiteNavigationService. The service emits the bundled menu first, so this
  // is never empty and the header does not flash blank on a cold load.
  public menuItems: MenuModel[] = [];

  private subscription = new Subscription();

  constructor(private router: Router, private navigation: SiteNavigationService) {}

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
