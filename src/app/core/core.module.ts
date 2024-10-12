import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { DxButtonModule, DxNumberBoxModule, DxAccordionModule, DxFormModule, DxDateBoxModule, DxAutocompleteModule, DxTextAreaModule, DxRadioGroupModule, DxSelectBoxModule, DxLoadIndicatorModule, DxCheckBoxModule, DxTextBoxModule, DxLookupModule, DxLoadPanelModule, DxDataGridModule, DxPopupModule } from "devextreme-angular";
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
import { HistoryComponent } from "./pages/history/history.component";
import { ContactComponent } from "./pages/contact/contact.component";
import { NewsletterComponent } from "./pages/newsletter/newsletter.component";
import { PrivatePolicyComponent } from "./pages/private-policy/private-policy.component";
import { TermsOfServiceComponent } from "./pages/terms-of-service/terms-of-service.component";
import { GiveComponent } from "./pages/give/give.component";
import { SeminarsComponent } from "./pages/seminars/seminars.component";
import { EquippingGroupsComponent } from "./pages/equipping-groups/equipping-groups.component";
import { CoachingWithImpactComponent } from "./pages/coaching-with-impact/coaching-with-impact.component";
import { LunchAndLearnComponent } from "./pages/lunch-and-learn/lunch-and-learn.component";
import { ImpactDisciplesModule } from "../../../impactdisciplescommon/src/impactdisciples.common.module";
import { YouTubePlayerModule } from '@angular/youtube-player';
import { ShoppingCartComponent } from "./store/shopping-cart/shopping-cart.component";
import { CheckoutComponent } from "./store/checkout/checkout.component";
import { LunchAndLearnFormComponent } from "./pages/lunch-and-learn/lunch-and-learn-form/lunch-and-learn-form.component";
import { SeminarFormComponent } from "./pages/seminars/seminar-form/seminar-form.component";
import { FormsModule } from "@angular/forms";
import { ConsultationSurveyComponent } from "./pages/consultation-survey/consultation-survey.component";
import { StoreComponent } from './pages/store/store.component';
import { BlogComponent } from './pages/blog/blog.component';
import { PodcastsComponent } from './pages/podcasts/podcasts.component';
import { EBooksComponent } from './pages/e-books/e-books.component';
import { PrayerTeamComponent } from './pages/prayer-team/prayer-team.component';
import { AccountComponent } from './pages/account/account.component';
import { TeamDetailsComponent } from './pages/team/team-details/team-details.component';
import { BlogDetailsComponent } from './pages/blog-details/blog-details.component';
import { BlogSidebarComponent } from './pages/blog/blog-sidebar/blog-sidebar.component';
import { BlogPostboxItemComponent } from './pages/blog/blog-postbox-item/blog-postbox-item.component';
import { RegistrationComponent } from './registration/registration.component';
import { RegistrationCheckoutComponent } from './registration-checkout/registration-checkout.component';
import { RegistrationCheckoutSuccessComponent } from './registration-checkout-success/registration-checkout-success.component';
import { StoreSidebarComponent } from './pages/store/store-sidebar/store-sidebar.component';
import { StorePostboxItemComponent } from './pages/store/store-postbox-item/store-postbox-item.component';
import { ProductDetailsComponent } from './pages/product-details/product-details.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SummitComponent } from "./pages/summit/summit.component";

@NgModule({
  declarations: [
    HomeComponent,
    HomeHeaderComponent,
    HomeHeaderSliderComponent,
    HomeServicesComponent,
    EventsComponent,
    EventDetailsComponent,
    TeamComponent,
    ShoppingCartComponent,
    CheckoutComponent,
    CheckoutSuccessComponent,
    HistoryComponent,
    ContactComponent,
    NewsletterComponent,
    PrivatePolicyComponent,
    TermsOfServiceComponent,
    GiveComponent,
    SeminarsComponent,
    SeminarFormComponent,
    EquippingGroupsComponent,
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
    BlogDetailsComponent,
    BlogSidebarComponent,
    BlogPostboxItemComponent,
    RegistrationComponent,
    RegistrationCheckoutComponent,
    RegistrationCheckoutSuccessComponent,
    StoreSidebarComponent,
    StorePostboxItemComponent,
    ProductDetailsComponent,
    ProfileComponent,
    SummitComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SharedModule,
    ThemeSharedModule,
    DxNumberBoxModule,
    DxAccordionModule,
    DxButtonModule,
    DxDataGridModule,
    DxFormModule,
    ImpactDisciplesModule,
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
    DxTextBoxModule
  ],
  exports: [
    HomeComponent,
    HomeHeaderComponent,
    HomeHeaderSliderComponent,
    HomeServicesComponent
  ]
})
export class CoreModule { }
