import { CommonModule, DatePipe } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { NavMenuComponent } from "./nav-menu/nav-menu.component";
import { MiniCartComponent } from "./components/mini-cart/mini-cart.component";
import { ExtraInfoComponent } from "./components/extra-info/extra-info.component";
import { FormsModule } from "@angular/forms";
import { OffcanvasComponent } from "./components/offcanvas/offcanvas.component";
import { BackToTopComponent } from "./components/back-to-top/back-to-top.component";
import { SubscribeAreaComponent } from "./components/subscribe-area/subscribe-area.component";
import { FooterComponent } from "./footer/footer.component";
import { TestimonialsComponent } from "./components/testimonials/testimonials.component";
import { DxButtonModule } from "devextreme-angular";
import { LocationPipe } from "./utils/pipes/location.pipe";
import { CourseNamePipe } from "./utils/pipes/course-name.pipe";
import { BookBannerComponent } from "./components/book-banner/book-banner.component";
import { BreadcrumbComponent } from "./components/breadcrumb/breadcrumb.component";

@NgModule({
  declarations: [
    NavMenuComponent,
    MiniCartComponent,
    ExtraInfoComponent,
    OffcanvasComponent,
    BackToTopComponent,
    SubscribeAreaComponent,
    FooterComponent,
    TestimonialsComponent,
    BookBannerComponent,
    BreadcrumbComponent,
    LocationPipe,
    CourseNamePipe
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DxButtonModule,
    DatePipe
  ],
  exports: [
    NavMenuComponent,
    MiniCartComponent,
    ExtraInfoComponent,
    OffcanvasComponent,
    BackToTopComponent,
    SubscribeAreaComponent,
    FooterComponent,
    TestimonialsComponent,
    BookBannerComponent,
    BreadcrumbComponent,
    LocationPipe,
    CourseNamePipe
  ]
})
export class SharedModule { }
