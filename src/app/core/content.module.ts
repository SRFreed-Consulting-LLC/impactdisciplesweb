import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { YouTubePlayerModule } from '@angular/youtube-player';
import {
  DxButtonModule, DxNumberBoxModule, DxAccordionModule, DxFormModule, DxDateBoxModule,
  DxAutocompleteModule, DxTextAreaModule, DxRadioGroupModule, DxSelectBoxModule,
  DxLoadIndicatorModule, DxCheckBoxModule, DxTextBoxModule, DxLookupModule, DxLoadPanelModule,
  DxDataGridModule, DxPopupModule, DxGalleryModule, DxValidatorModule, DxTabsModule
} from "devextreme-angular";
import { SharedModule } from "../shared/shared.module";
import { AboutUsComponent } from "./pages/about-us/about-us.component";
import { ContactComponent } from "./pages/contact/contact.component";
import { NewsletterComponent } from "./pages/newsletter/newsletter.component";
import { GiveComponent } from "./pages/give/give.component";
import { SeminarsComponent } from "./pages/seminars/seminars.component";
import { SeminarFormComponent } from "./pages/seminars/seminar-form/seminar-form.component";
import { EquippingGroupsComponent } from "./pages/equipping-groups/equipping-groups.component";
import { EquippingGroupsPastorsComponent } from "./pages/equipping-groups/equipping-groups-pastors/equipping-groups-pastors.component";
import { EquippingGroupsLeadersComponent } from "./pages/equipping-groups/equipping-groups-leaders/equipping-groups-leaders.component";
import { EquippingGroupsChurchesComponent } from "./pages/equipping-groups/equipping-groups-churches/equipping-groups-churches.component";
import { CoachingWithImpactComponent } from "./pages/coaching-with-impact/coaching-with-impact.component";
import { LunchAndLearnComponent } from "./pages/lunch-and-learn/lunch-and-learn.component";
import { LunchAndLearnFormComponent } from "./pages/lunch-and-learn/lunch-and-learn-form/lunch-and-learn-form.component";
import { PrivatePolicyComponent } from "./pages/private-policy/private-policy.component";
import { TermsOfServiceComponent } from "./pages/terms-of-service/terms-of-service.component";
import { CustomerReviewsComponent } from "./pages/customer-reviews/customer-reviews.component";
import { ConsultationSurveyComponent } from "./pages/consultation-survey/consultation-survey.component";
import { MonthlyNewsletterComponent } from "./pages/monthly-newsletter/monthly-newsletter.component";
import { PrayerTeamComponent } from "./pages/prayer-team/prayer-team.component";

const routes: Routes = [
  { path: 'about-us', component: AboutUsComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'newsletter', component: NewsletterComponent },
  { path: 'give', component: GiveComponent },
  { path: 'seminars', component: SeminarsComponent },
  { path: 'seminar-form', component: SeminarFormComponent },
  { path: 'equipping-groups', component: EquippingGroupsComponent },
  { path: 'equipping-groups-pastors', component: EquippingGroupsPastorsComponent },
  { path: 'equipping-groups-leaders', component: EquippingGroupsLeadersComponent },
  { path: 'equipping-groups-churches', component: EquippingGroupsChurchesComponent },
  { path: 'coaching-with-impact', component: CoachingWithImpactComponent },
  { path: 'lunch-and-learns', component: LunchAndLearnComponent },
  { path: 'lunch-and-learn-form', component: LunchAndLearnFormComponent },
  { path: 'private-policy', component: PrivatePolicyComponent },
  { path: 'terms', component: TermsOfServiceComponent },
  { path: 'customer-reviews', component: CustomerReviewsComponent },
  { path: 'consultation-survey', component: ConsultationSurveyComponent },
  { path: 'monthly-newsletter', component: MonthlyNewsletterComponent },
  { path: 'prayer-team', component: PrayerTeamComponent }
];

@NgModule({
  declarations: [
    AboutUsComponent,
    ContactComponent,
    NewsletterComponent,
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
    PrivatePolicyComponent,
    TermsOfServiceComponent,
    CustomerReviewsComponent,
    ConsultationSurveyComponent,
    MonthlyNewsletterComponent,
    PrayerTeamComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    YouTubePlayerModule,
    DxNumberBoxModule,
    DxAccordionModule,
    DxButtonModule,
    DxDataGridModule,
    DxFormModule,
    DxValidatorModule,
    DxTabsModule,
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
    RouterModule.forChild(routes)
  ]
})
export class ContentFeatureModule { }
