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

  /**
   * Which dropdown is open, for ASSISTIVE TECHNOLOGY only.
   *
   * What is actually on screen is decided by CSS (`:hover, :focus-within` in
   * _header.scss), deliberately: the visual state must not depend on this
   * component being right. This field exists so `aria-expanded` can tell a
   * screen reader what a sighted user can see, and it follows FOCUS - which
   * is the thing a keyboard user moves - rather than the mouse.
   */
  openIndex: number | null = null;

  /** Which item Escape has dismissed while focus is still on its label. See
   *  closeMenu(); cleared the moment focus leaves or a pointer arrives. */
  dismissedIndex: number | null = null;

  hasQuery(link?: string): boolean {
    return !!link && link.includes('?');
  }

  /**
   * What `aria-expanded` says, and it has to match what is on screen.
   *
   * Focus alone is not enough: Escape leaves focus ON the label with the list
   * closed, and announcing "expanded" there tells a screen-reader user the
   * opposite of the truth - the one state where they cannot check for
   * themselves.
   */
  isOpen(index: number): boolean {
    return this.openIndex === index && this.dismissedIndex !== index;
  }

  /** A menu entry that opens a list instead of going somewhere. "Training"
   *  has children and no address of its own; "Donate" has both and stays a
   *  plain link. */
  isMenuLabel(item: IMenuType): boolean {
    return !!item.hasDropdown && !item.link;
  }

  /** Enter or Space on a label moves INTO its list, so the control does what
   *  its role says it does. Focus alone already reveals the list. */
  enterMenu(event: Event, row: HTMLElement): void {
    event.preventDefault();
    row.querySelector<HTMLElement>('ul.submenu a')?.focus();
  }

  /**
   * Escape closes the list and puts focus back on its label.
   *
   * Bound on the whole ITEM, not on the label: from inside the list - which
   * is exactly where someone wants out - a handler on the label alone never
   * fires, and Escape does nothing while looking handled in the source.
   *
   * Returning focus to the label is what a keyboard user needs (dumping them
   * at the top of the page is not "closing"), but focus on the label is also
   * what holds the list open, so `dismissedIndex` overrides :focus-within
   * until focus leaves or a pointer arrives.
   */
  closeMenu(event: Event, row: HTMLElement, index: number): void {
    event.stopPropagation();
    this.dismissedIndex = index;
    row.querySelector<HTMLElement>(':scope > a')?.focus();
  }

  /** Focus left the whole item - not merely moved between its own links,
   *  which fires focusout too and must NOT read as closed. */
  onLeave(event: FocusEvent, index: number): void {
    const row = event.currentTarget as HTMLElement;
    const to = event.relatedTarget as Node | null;
    if (to && row.contains(to)) {
      return;
    }
    if (this.openIndex === index) {
      this.openIndex = null;
    }
    if (this.dismissedIndex === index) {
      this.dismissedIndex = null;
    }
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
