import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPayPalModule } from 'ngx-paypal';
import { SharedModule } from '../../shared/shared.module';
import { GroupsSharedModule } from '../groups/groups-shared.module';

import { StoreComponent } from './pages/store/store.component';
import { StoreSidebarComponent } from './pages/store/store-sidebar/store-sidebar.component';
import { StorePostboxItemComponent } from './pages/store/store-postbox-item/store-postbox-item.component';
import { ProductDetailsComponent } from './pages/product-details/product-details.component';
import { EBooksComponent } from './pages/e-books/e-books.component';
import { ShoppingCartComponent } from './pages/shopping-cart/shopping-cart.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { CheckoutStepsComponent } from './checkout/checkout-steps/checkout-steps.component';
import { CheckoutSuccessComponent } from './checkout-success/checkout-success.component';
import { CartDrawerComponent } from './cart-drawer/cart-drawer.component';
import { SpinnerComponent } from './spinner/spinner.component';

// This was originally built as a self-contained sandbox to compare a
// reimagined store/cart/checkout against the original side by side (see
// the plan doc, "Reimagine Store / Cart / Checkout") -- that comparison is
// over and this module now IS the site's store/cart/checkout, serving the
// canonical paths below. The old implementation it replaced (formerly
// src/app/core/store/, src/app/core/pages/store/, .../e-books/,
// .../product-details/, and the old CartService) has been deleted.
// event-details.component.ts (paid event registration, a separate feature
// that happens to share the same cart/checkout) was migrated onto this
// module's CartService for the same reason.
//
// Routes use full top-level paths (not nested under a parent route) to
// match this app's existing routing convention -- see
// app-routing.module.ts's firstSegmentMatcher comment: the matcher there
// consumes zero segments, so the whole path is matched by this module's
// own routes.
const routes: Routes = [
  { path: 'store', component: StoreComponent },
  { path: 'spanish-resources', component: StoreComponent },
  { path: 'e-books', component: EBooksComponent },
  { path: 'product-details/:id', component: ProductDetailsComponent },
  { path: 'shopping-cart', component: ShoppingCartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'checkout-success', component: CheckoutSuccessComponent }
];

@NgModule({
  declarations: [
    StoreComponent,
    StoreSidebarComponent,
    StorePostboxItemComponent,
    ProductDetailsComponent,
    EBooksComponent,
    ShoppingCartComponent,
    CheckoutComponent,
    CheckoutStepsComponent,
    CheckoutSuccessComponent,
    CartDrawerComponent,
    SpinnerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    // "Groups studying this book" on the product page - the card is
    // declared in GroupsSharedModule so the lazy finder and this lazy
    // module can both use it (a component may only be declared once).
    GroupsSharedModule,
    NgxPayPalModule,
    RouterModule.forChild(routes)
  ]
})
export class StoreFeatureModule { }
