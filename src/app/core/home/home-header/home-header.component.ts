import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';
import {
  CART_CHANGED_EVENT,
  CART_OPEN_DRAWER_EVENT,
  CartSummary
} from 'src/app/core/store/services/cart-events';

const CART_SUMMARY_STORAGE_KEY = 'cart-summary';

@Component({
    selector: 'app-home-header',
    templateUrl: './home-header.component.html',
    styleUrls: ['./home-header.component.scss'],
    standalone: false
})
export class HomeHeaderComponent implements OnInit, OnDestroy {
  public sticky = true;
  public impactDisciplesInfo = impactDisciplesInfo;

  public cart: CartSummary = { quantity: 0, total: 0 };

  // Not a CartService import (see cart-events.ts for why: the store
  // module is still its own lazy chunk, and this header ships in every
  // page's eager bundle) -- this event is what keeps the badge live as
  // items are added/removed anywhere in the store, same as the drawer does
  // via its own cartChanged$ subscription.
  private readonly onCartChanged = (event: Event) => {
    this.cart = (event as CustomEvent<CartSummary>).detail;
  };

  @HostListener('window:scroll') onscroll() {
    if (window.scrollY > 80) {
      this.sticky = true;
    } else {
      this.sticky = false;
    }
  }

  constructor(public utilsService: UtilsService) { }

  ngOnInit(): void {
    this.loadCartSummary();
    window.addEventListener(CART_CHANGED_EVENT, this.onCartChanged);
  }

  ngOnDestroy(): void {
    window.removeEventListener(CART_CHANGED_EVENT, this.onCartChanged);
  }

  openCartDrawer(): void {
    window.dispatchEvent(new CustomEvent(CART_OPEN_DRAWER_EVENT));
  }

  private loadCartSummary(): void {
    try {
      const stored = JSON.parse(localStorage.getItem(CART_SUMMARY_STORAGE_KEY) || 'null');
      this.cart = stored?.quantity != null ? stored : { quantity: 0, total: 0 };
    } catch {
      this.cart = { quantity: 0, total: 0 };
    }
  }
}
