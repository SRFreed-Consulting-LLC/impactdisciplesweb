import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
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
  private readonly webConfigService = inject(WebConfigService);

  public sticky = true;

  /**
   * THE LOGO, FROM WEB CONFIG since 2026-08-31.
   *
   * It was a hardcoded url in impact-disciples.data.ts - a source file
   * only a developer could change - which meant the Logo field in Web
   * Config did nothing at all, and the address and phone number sitting
   * beside it in that same file silently disagreed with the real ones.
   * That file is deleted; this is the only copy now.
   *
   * Empty until the read lands, and empty forever if it fails - so the
   * template falls back to the bundled copy below. It used to bind `logo`
   * directly, on the assumption that an empty src degrades to alt text. It
   * does not: browsers draw a BROKEN IMAGE ICON, which is what production
   * showed on 2026-09-02 after the tenancy cutover, because prod's Web
   * Config document had never been given a `logo` field at all. The nav and
   * the cart - which are what the header is FOR - were unaffected, but the
   * ministry's own logo was a broken picture on every page.
   *
   * WebConfigService caches, so the footer's read and this one are one
   * request.
   */
  public logo = '';

  /**
   * The same image, bundled. Byte-identical (42,084 bytes) to the object the
   * Web Config url points at - it is the original that the 2026-08-31 change
   * orphaned, kept precisely so a missing or unreachable config value
   * degrades to the real logo instead of to nothing.
   */
  public readonly fallbackLogo = 'assets/Impact-Logo_Black.png';

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
    this.webConfigService.getConfig()
      .then((config) => (this.logo = config?.logo ?? ''))
      .catch(() => undefined);
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
