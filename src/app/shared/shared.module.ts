import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ThemeSharedModule } from "../theme/shared/theme-shared.module";
import { NavMenuComponent } from "./nav-menu/nav-menu.component";
import { MiniCartComponent } from "./components/mini-cart/mini-cart.component";
import { ExtraInfoComponent } from "./components/extra-info/extra-info.component";
import { SearchPopupComponent } from "./components/search-popup/search-popup.component";
import { FormsModule } from "@angular/forms";
import { OffcanvasComponent } from "./components/offcanvas/offcanvas.component";
import { BackToTopComponent } from "./components/back-to-top/back-to-top.component";
import { SubscribeAreaComponent } from "./components/subscribe-area/subscribe-area.component";
import { FooterComponent } from "./footer/footer.component";
import { TestimonialsComponent } from "./components/testimonials/testimonials.component";

@NgModule({
  declarations: [
    NavMenuComponent,
    MiniCartComponent,
    ExtraInfoComponent,
    SearchPopupComponent,
    OffcanvasComponent,
    BackToTopComponent,
    SubscribeAreaComponent,
    FooterComponent,
    TestimonialsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  exports: [
    NavMenuComponent,
    MiniCartComponent,
    ExtraInfoComponent,
    SearchPopupComponent,
    OffcanvasComponent,
    BackToTopComponent,
    SubscribeAreaComponent,
    FooterComponent,
    TestimonialsComponent
  ]
})
export class SharedModule { }