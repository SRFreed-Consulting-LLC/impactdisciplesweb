import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { DxButtonModule, DxNumberBoxModule, DxAccordionModule, DxFormModule, DxDateBoxModule, DxAutocompleteModule, DxTextAreaModule, DxRadioGroupModule, DxSelectBoxModule, DxLoadIndicatorModule, DxCheckBoxModule, DxTextBoxModule, DxLookupModule, DxLoadPanelModule, DxDataGridModule, DxPopupModule, DxGalleryModule, DxValidatorModule, DxTabsModule } from "devextreme-angular";
import { SharedModule } from "../shared/shared.module";
import { HomeHeaderComponent } from "./home/home-header/home-header.component";
import { HomeComponent } from "./home/home.component";
import { ThemeSharedModule } from "../theme/shared/theme-shared.module";
import { HomeHeaderSliderComponent } from "./home/home-header-slider/home-header-slider.component";
import { HomeServicesComponent } from "./home/home-services/home-services.component";
import { EventsComponent } from "./pages/events/events.component";
import { TeamComponent } from "./pages/team/team.component";
import { EventDetailsComponent } from "./pages/events/event-details/event-details.component";
import { CheckoutSuccessComponent } from "./store/checkout-success/checkout-success.component";
import { ContactComponent } from "./pages/contact/contact.component";
import { NewsletterComponent } from "./pages/newsletter/newsletter.component";
import { PrivatePolicyComponent } from "./pages/private-policy/private-policy.component";
import { TermsOfServiceComponent } from "./pages/terms-of-service/terms-of-service.component";
import { GiveComponent } from "./pages/give/give.component";
import { SeminarsComponent } from "./pages/seminars/seminars.component";
import { EquippingGroupsChurchesComponent } from "./pages/equipping-groups/equipping-groups-pastors/equipping-groups-churches.component";
import { CoachingWithImpactComponent } from "./pages/coaching-with-impact/coaching-with-impact.component";
import { LunchAndLearnComponent } from "./pages/lunch-and-learn/lunch-and-learn.component";
import { YouTubePlayerModule } from '@angular/youtube-player';
import { ShoppingCartComponent } from "./store/shopping-cart/shopping-cart.component";
import { CheckoutComponent } from "./store/checkout/checkout.component";
import { LunchAndLearnFormComponent } from "./pages/lunch-and-learn/lunch-and-learn-form/lunch-and-learn-form.component";
import { SeminarFormComponent } from "./pages/seminars/seminar-form/seminar-form.component";
import { FormsModule } from "@angular/forms";
import { ConsultationSurveyComponent } from "./pages/consultation-survey/consultation-survey.component";
import { StoreComponent } from './pages/store/store.component';
import { BlogComponent } from './pages/dmms/dmm.component';
import { PodcastsComponent } from './pages/podcasts/podcasts.component';
import { EBooksComponent } from './pages/e-books/e-books.component';
import { PrayerTeamComponent } from './pages/prayer-team/prayer-team.component';
import { AccountComponent } from './pages/account/account.component';
import { TeamDetailsComponent } from './pages/team/team-details/team-details.component';
import { BlogPostboxItemComponent } from './pages/dmms/dmm-postbox-item/dmm-postbox-item.component';
import { StoreSidebarComponent } from './pages/store/store-sidebar/store-sidebar.component';
import { StorePostboxItemComponent } from './pages/store/store-postbox-item/store-postbox-item.component';
import { ProductDetailsComponent } from './pages/product-details/product-details.component';
import { SummitComponent } from "./pages/summit/summit.component";
import { PodcastSidebarComponent } from './pages/podcasts/podcast-sidebar/podcast-sidebar.component';
import { PodcastPostboxItemComponent } from './pages/podcasts/podcast-postbox-item/podcast-postbox-item.component';
import { AboutUsComponent } from "./pages/about-us/about-us.component";
import { CustomerReviewsComponent } from "./pages/customer-reviews/customer-reviews.component";
import { MonthlyNewsletterComponent } from "./pages/monthly-newsletter/monthly-newsletter.component";
import { NgxPayPalModule } from "ngx-paypal";
import { SummitPreviewComponent } from "./pages/summit-preview/summit-preview.component";
import { ScheduleComponent } from "./pages/schedule/schedule.component";
import { BreakoutSessionsComponent } from "./pages/schedule/breakout-sessions/breakout-sessions.component";
import { CourseModalComponent } from "./pages/schedule/course-modal/course-modal.component";
import { EquippingGroupsPastorsComponent } from "./pages/equipping-groups/equipping-groups-churches/equipping-groups-pastors.component";
import { EquippingGroupsComponent } from "./pages/equipping-groups/equipping-groups.component";
import { EquippingGroupsLeadersComponent } from "./pages/equipping-groups/equipping-groups-leaders/equipping-groups-leaders.component";

@NgModule({
  declarations: [
    HomeComponent,
    HomeHeaderComponent,
    HomeHeaderSliderComponent,
    HomeServicesComponent,
    EventsComponent,
    EventDetailsComponent,
    TeamComponent,
    AboutUsComponent,
    ShoppingCartComponent,
    CheckoutComponent,
    CheckoutSuccessComponent,
    ContactComponent,
    NewsletterComponent,
    PrivatePolicyComponent,
    TermsOfServiceComponent,
    GiveComponent,
    SeminarsComponent,
    SeminarFormComponent,
    EquippingGroupsComponent,
    EquippingGroupsPastorsComponent,
    EquippingGroupsLeadersComponent,
    EquippingGroupsChurchesComponent,
    CoachingWithImpactComponent,
    LunchAndLearnComponent,
    LunchAndLearnFormComponent,
    ConsultationSurveyComponent,
    StoreComponent,
    BlogComponent,
    PodcastsComponent,
    EBooksComponent,
    PrayerTeamComponent,
    AccountComponent,
    TeamDetailsComponent,
    BlogPostboxItemComponent,
    StoreSidebarComponent,
    StorePostboxItemComponent,
    ProductDetailsComponent,
    SummitComponent,
    SummitPreviewComponent,
    PodcastSidebarComponent,
    PodcastPostboxItemComponent,
    CustomerReviewsComponent,
    MonthlyNewsletterComponent,
    ScheduleComponent,
    BreakoutSessionsComponent,
    CourseModalComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SharedModule,

    DxNumberBoxModule,
    DxAccordionModule,
    DxButtonModule,
    DxDataGridModule,
    DxFormModule,
    DxValidatorModule,
    DxTabsModule,
    YouTubePlayerModule,
    DxDateBoxModule,
    DxAutocompleteModule,
    DxLoadPanelModule,
    DxLookupModule,
    DxPopupModule,
    DxRadioGroupModule,
    DxTextAreaModule,
    DxSelectBoxModule,
    DxLoadIndicatorModule,
    DxCheckBoxModule,
    DxTextBoxModule,
    DxGalleryModule,
    NgxPayPalModule,
  ],
  exports: [
    HomeComponent,
    HomeHeaderComponent,
    HomeHeaderSliderComponent,
    HomeServicesComponent
  ]
})
export class CoreModule { }
