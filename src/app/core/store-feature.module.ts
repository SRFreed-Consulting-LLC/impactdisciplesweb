import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgxPayPalModule } from "ngx-paypal";
import { SharedModule } from "../shared/shared.module";
import { StoreComponent } from "./pages/store/store.component";
import { StoreSidebarComponent } from "./pages/store/store-sidebar/store-sidebar.component";
import { StorePostboxItemComponent } from "./pages/store/store-postbox-item/store-postbox-item.component";
import { ProductDetailsComponent } from "./pages/product-details/product-details.component";
import { ShoppingCartComponent } from "./store/shopping-cart/shopping-cart.component";
import { CheckoutComponent } from "./store/checkout/checkout.component";
import { CheckoutSuccessComponent } from "./store/checkout-success/checkout-success.component";
import { EBooksComponent } from "./pages/e-books/e-books.component";

const routes: Routes = [
  {
    path: 'store',
    component: StoreComponent
  },
  {
    path: 'spanish-resources',
    component: StoreComponent,
    data: { catagory: 'Espanol Resources' }
  },
  {
    path: 'product-details/:id',
    component: ProductDetailsComponent
  },
  {
    path: 'shopping-cart',
    component: ShoppingCartComponent
  },
  {
    path: 'checkout',
    component: CheckoutComponent
  },
  {
    path: 'checkout-success',
    component: CheckoutSuccessComponent
  },
  {
    path: 'e-books',
    component: EBooksComponent
  }
];

@NgModule({
  declarations: [
    StoreComponent,
    StoreSidebarComponent,
    StorePostboxItemComponent,
    ProductDetailsComponent,
    ShoppingCartComponent,
    CheckoutComponent,
    CheckoutSuccessComponent,
    EBooksComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    NgxPayPalModule,
    RouterModule.forChild(routes)
  ]
})
export class StoreFeatureModule { }
