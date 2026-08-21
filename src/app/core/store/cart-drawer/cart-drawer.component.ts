import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Offcanvas } from 'bootstrap';
import { Router } from '@angular/router';
import { CartItem } from '@impact-common/shared/models/utils/cart.model';
import { CartLineItem } from '../models/cart-line-item.model';
import { CartService } from '../services/cart.service';
import { CART_OPEN_DRAWER_EVENT } from '../services/cart-events';
import { PricingService } from '../services/pricing.service';
import { CouponApplicationService } from '../services/coupon-application.service';

// Cart drawer for the store. Built on Bootstrap's offcanvas component --
// already a dependency, already used elsewhere in this app for the mobile
// nav menu (OffcanvasComponent) and for modals (DialogService) -- so no new
// UI library. Declared inside StoreFeatureModule (not the app-wide
// SharedModule), since it's scoped to store's own pages and doesn't
// need to be reachable from the global header.
@Component({
  selector: 'app-cart-drawer',
  templateUrl: './cart-drawer.component.html',
  styleUrls: ['./cart-drawer.component.scss'],
  standalone: false
})
export class CartDrawerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('drawer') drawerRef: ElementRef<HTMLElement>;

  lineItems: CartLineItem[] = [];
  subtotal = 0;
  discount = 0;
  total = 0;

  couponCode = '';
  couponMessage = '';
  couponMessageType: 'success' | 'error' = 'success';
  lineNotes = new Map<string, string>();

  private offcanvas: Offcanvas;

  // Was CartDrawerStateService, a providedIn:'root' singleton wrapping this
  // exact window listener for what turned out to be its only subscriber
  // (this component). Inlined directly -- but unlike that singleton (whose
  // constructor, and so its addEventListener, only ever ran once per app
  // lifetime), this component is re-created on every store-page navigation,
  // so the listener needs real add/remove lifecycle management here to
  // avoid piling up duplicate listeners. Bound field (not an inline arrow
  // in addEventListener) so removeEventListener can find the same
  // reference, same pattern HomeHeaderComponent already uses for its own
  // cart-event listener.
  private readonly onOpenRequested = () => this.offcanvas?.show();

  constructor(
    public cartService: CartService,
    private pricingService: PricingService,
    private couponApplicationService: CouponApplicationService,
    private router: Router,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    // Subscribed here, not ngAfterViewInit: cartChanged$ is a
    // BehaviorSubject, so subscribing emits its current value synchronously.
    // Doing that in ngAfterViewInit updates template-bound fields (e.g.
    // lineItems.length in "Your Cart ({{ lineItems.length }})") *after*
    // Angular has already checked this view for the current change-detection
    // pass -- a textbook NG0100 ExpressionChangedAfterItHasBeenCheckedError.
    // ngOnInit runs before that first check, so it's safe here.
    this.cartService.cartChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(items => this.recompute(items));
    window.addEventListener(CART_OPEN_DRAWER_EVENT, this.onOpenRequested);
  }

  ngAfterViewInit(): void {
    this.offcanvas = new Offcanvas(this.drawerRef.nativeElement);
  }

  ngOnDestroy(): void {
    window.removeEventListener(CART_OPEN_DRAWER_EVENT, this.onOpenRequested);
  }

  private recompute(items: CartItem[]): void {
    this.lineItems = this.pricingService.toCartLineItems(items);
    this.subtotal = this.pricingService.cartSubtotal(items);
    this.discount = this.pricingService.cartDiscount(items);
    this.total = this.pricingService.cartTotal(items);
  }

  increment(item: CartItem): void {
    this.cartService.addCartProduct(item, 1, false);
  }

  decrement(item: CartItem): void {
    this.cartService.quantityDecrement(item);
  }

  remove(item: CartItem): void {
    this.cartService.removeCartProduct(item);
  }

  async applyCoupon(): Promise<void> {
    const items = this.cartService.getCartProducts();
    this.couponApplicationService.clear(items);
    this.lineNotes.clear();

    const result = await this.couponApplicationService.validateAndApply(items, this.couponCode);

    result.lineResults.forEach(line => {
      if (line.skippedReason) {
        this.lineNotes.set(line.itemId, line.skippedReason);
      }
    });

    this.couponMessage = result.message;
    this.couponMessageType = result.applied ? 'success' : 'error';
    this.cartService.setCouponCode(result.applied ? this.couponCode : '');

    // validateAndApply() mutates item.discount/discountPrice in place on
    // the same cart-item objects CartService-new holds -- touch() re-persists
    // + re-emits so the drawer, /cart page, and bar all agree immediately.
    this.cartService.touch();
    this.recompute(items);
  }

  closeAndGoToCart(): void {
    this.offcanvas.hide();
    this.router.navigateByUrl('/shopping-cart');
  }

  closeAndGoToCheckout(): void {
    this.offcanvas.hide();
    this.router.navigateByUrl('/checkout');
  }
}
