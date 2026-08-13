import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Offcanvas } from 'bootstrap';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CartItem } from 'src/app/common/models/utils/cart.model';
import { CartLineItem } from '../models/cart-line-item.model';
import { CartService } from '../services/cart.service';
import { CartDrawerStateService } from '../services/cart-drawer-state.service';
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
  private ngUnsubscribe = new Subject<void>();

  constructor(
    public cartService: CartService,
    private pricingService: PricingService,
    private couponApplicationService: CouponApplicationService,
    private drawerState: CartDrawerStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribed here, not ngAfterViewInit: cartChanged$ is a
    // BehaviorSubject, so subscribing emits its current value synchronously.
    // Doing that in ngAfterViewInit updates template-bound fields (e.g.
    // lineItems.length in "Your Cart ({{ lineItems.length }})") *after*
    // Angular has already checked this view for the current change-detection
    // pass -- a textbook NG0100 ExpressionChangedAfterItHasBeenCheckedError.
    // ngOnInit runs before that first check, so it's safe here.
    this.cartService.cartChanged$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(items => this.recompute(items));
  }

  ngAfterViewInit(): void {
    this.offcanvas = new Offcanvas(this.drawerRef.nativeElement);

    this.drawerState.openRequested$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => this.offcanvas.show());
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
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
