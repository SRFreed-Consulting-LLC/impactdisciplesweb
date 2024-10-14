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
import { ComingSoonComponent } from "./components/coming-soon/coming-soon.component";
import { PaginationComponent } from "./components/pagination/pagination.component";
import { DiscipleMakingSummitBannerComponent } from './components/disciple-making-summit-banner/disciple-making-summit-banner.component';
import { CategoryNamePipe } from "./utils/pipes/category-name.pipe";
import { TimeFormatPipe } from "./utils/pipes/time-format.pipe";

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
    ComingSoonComponent,
    PaginationComponent,
    LocationPipe,
    CourseNamePipe,
    CategoryNamePipe,
    TimeFormatPipe,
    DiscipleMakingSummitBannerComponent
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
    ComingSoonComponent,
    PaginationComponent,
    LocationPipe,
    CourseNamePipe,
    CategoryNamePipe,
    TimeFormatPipe,
    DiscipleMakingSummitBannerComponent
  ]
})
export class SharedModule { }
