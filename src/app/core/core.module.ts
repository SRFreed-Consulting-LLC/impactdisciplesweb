import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { DxButtonModule, DxToolbarModule, DxTabsModule, DxNumberBoxModule, DxAccordionModule, DxFormModule } from "devextreme-angular";
import { SharedModule } from "../shared/shared.module";
import { HomeHeaderComponent } from "./home/home-header/home-header.component";
import { HomeComponent } from "./home/home.component";
import { ThemeSharedModule } from "../theme/shared/theme-shared.module";
import { HomeHeaderSliderComponent } from "./home/home-header-slider/home-header-slider.component";
import { HomeServicesComponent } from "./home/home-services/home-services.component";
import { EventsComponent } from "./pages/events/events.component";
import { TeamComponent } from "./pages/team/team.component";
import { EventDetailsComponent } from "./pages/events/event-details/event-details.component";
import { EventCheckoutComponent } from "./pages/event-checkout/event-checkout.component";
import { CheckoutSuccessComponent } from "./pages/checkout-success/checkout-success.component";
import { HistoryComponent } from "./pages/history/history.component";
import { ContactComponent } from "./pages/contact/contact.component";
import { NewsletterComponent } from "./pages/newsletter/newsletter.component";
import { PrivatePolicyComponent } from "./pages/private-policy/private-policy.component";
import { TermsOfServiceComponent } from "./pages/terms-of-service/terms-of-service.component";
import { GiveComponent } from "./pages/give/give.component";


@NgModule({
  declarations: [
    HomeComponent,
    HomeHeaderComponent,
    HomeHeaderSliderComponent,
    HomeServicesComponent,
    EventsComponent,
    EventDetailsComponent,
    TeamComponent,
    EventCheckoutComponent,
    CheckoutSuccessComponent,
    HistoryComponent,
    ContactComponent,
    NewsletterComponent,
    PrivatePolicyComponent,
    TermsOfServiceComponent,
    GiveComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    ThemeSharedModule,
    DxNumberBoxModule,
    DxAccordionModule,
    DxButtonModule,
    DxFormModule
  ],
  exports: [
    HomeComponent,
    HomeHeaderComponent,
    HomeHeaderSliderComponent,
    HomeServicesComponent
  ]
})
export class CoreModule { }
