import { CommonModule, DatePipe } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { NavMenuComponent } from "./nav-menu/nav-menu.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DynamicFormComponent } from "./form-renderer/dynamic-form.component";
import { DynamicFormFieldComponent } from "./form-renderer/dynamic-form-field.component";
import { OffcanvasComponent } from "./components/offcanvas/offcanvas.component";
import { BackToTopComponent } from "./components/back-to-top/back-to-top.component";
import { CampaignPopupComponent } from "./components/campaign-popup/campaign-popup.component";
import { SubscribeAreaComponent } from "./components/subscribe-area/subscribe-area.component";
import { FooterComponent } from "./footer/footer.component";
import { LocationPipe } from "./utils/pipes/location.pipe";
import { CourseNamePipe } from "./utils/pipes/course-name.pipe";
import { BookBannerComponent } from "./components/book-banner/book-banner.component";
import { BreadcrumbComponent } from "./components/breadcrumb/breadcrumb.component";
import { ComingSoonComponent } from "./components/coming-soon/coming-soon.component";
import { PaginationComponent } from "./components/pagination/pagination.component";
import { DiscipleMakingSummitBannerComponent } from './components/disciple-making-summit-banner/disciple-making-summit-banner.component';
import { TimeFormatPipe } from "./utils/pipes/time-format.pipe";
import { AnimateDirective } from "./utils/directives/animate.directive";
import { ConsulationBannerComponent } from "./components/consulation-banner/consulation-banner.component";
import { HeaderComponent } from "./components/header/header.component";
// HomeHeaderComponent is the global site header (logo/nav/cart) -- it is
// used from nearly every page's template (see the app-wide grep in the perf
// sweep notes), not just the homepage, so it lives here in the eagerly
// loaded SharedModule rather than in a lazy-loaded feature module.
import { HomeHeaderComponent } from "../core/home/home-header/home-header.component";

@NgModule({
  declarations: [
    NavMenuComponent,
    OffcanvasComponent,
    BackToTopComponent,
    SubscribeAreaComponent,
    FooterComponent,
    BookBannerComponent,
    BreadcrumbComponent,
    ComingSoonComponent,
    PaginationComponent,
    LocationPipe,
    CourseNamePipe,
    TimeFormatPipe,
    DiscipleMakingSummitBannerComponent,
    AnimateDirective,
    ConsulationBannerComponent,
    HeaderComponent,
    HomeHeaderComponent,
    DynamicFormComponent,
    DynamicFormFieldComponent,
    CampaignPopupComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe
  ],
  exports: [
    NavMenuComponent,
    OffcanvasComponent,
    BackToTopComponent,
    CampaignPopupComponent,
    SubscribeAreaComponent,
    FooterComponent,
    BookBannerComponent,
    BreadcrumbComponent,
    ComingSoonComponent,
    PaginationComponent,
    LocationPipe,
    CourseNamePipe,
    TimeFormatPipe,
    DiscipleMakingSummitBannerComponent,
    AnimateDirective,
    ConsulationBannerComponent,
    HeaderComponent,
    HomeHeaderComponent,
    DynamicFormComponent,
    DynamicFormFieldComponent
  ]
})
export class SharedModule { }
