import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormPageComponent, FormPageData } from "./pages/form-page/form-page.component";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { YouTubePlayerModule } from '@angular/youtube-player';
import { SharedModule } from "../shared/shared.module";
import { AboutUsComponent } from "./pages/about-us/about-us.component";
import { ContactComponent } from "./pages/contact/contact.component";
import { NewsletterComponent } from "./pages/newsletter/newsletter.component";
import { GiveComponent } from "./pages/give/give.component";
import { SeminarsComponent } from "./pages/seminars/seminars.component";
import { EquippingGroupsComponent } from "./pages/equipping-groups/equipping-groups.component";
import { EquippingGroupsPastorsComponent } from "./pages/equipping-groups/equipping-groups-pastors/equipping-groups-pastors.component";
import { EquippingGroupsLeadersComponent } from "./pages/equipping-groups/equipping-groups-leaders/equipping-groups-leaders.component";
import { EquippingGroupsChurchesComponent } from "./pages/equipping-groups/equipping-groups-churches/equipping-groups-churches.component";
import { CoachingWithImpactComponent } from "./pages/coaching-with-impact/coaching-with-impact.component";
import { LunchAndLearnComponent } from "./pages/lunch-and-learn/lunch-and-learn.component";
import { PrivatePolicyComponent } from "./pages/private-policy/private-policy.component";
import { TermsOfServiceComponent } from "./pages/terms-of-service/terms-of-service.component";
import { CustomerReviewsComponent } from "./pages/customer-reviews/customer-reviews.component";
import { MonthlyNewsletterComponent } from "./pages/monthly-newsletter/monthly-newsletter.component";
import { NewsletterViewComponent } from "./pages/monthly-newsletter/newsletter-view/newsletter-view.component";
import { PrayerTeamComponent } from "./pages/prayer-team/prayer-team.component";

// Exported for form-page.contract.spec.ts: the three form pages carry
// their form ids in route data now, and a wrong id fails silently on a
// live page, so the spec asserts against the real route table rather than
// a copy of it.
export const routes: Routes = [
  { path: 'about-us', component: AboutUsComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'newsletter', component: NewsletterComponent },
  { path: 'give', component: GiveComponent },
  { path: 'seminars', component: SeminarsComponent },
  {
    path: 'seminar-form', component: FormPageComponent,
    data: {
      formId: 'SEp1UJlYaFDz50Nfe5Hh',
      submitButtonText: 'Request to Book a Seminar',
      currentPageName: 'Seminar Request Form',
      previousLinkName: 'Seminars',
      previousLink: '/seminars',
      columnClass: 'col-xl-8 col-lg-8'
    } as FormPageData
  },
  { path: 'equipping-groups', component: EquippingGroupsComponent },
  { path: 'equipping-groups-pastors', component: EquippingGroupsPastorsComponent },
  { path: 'equipping-groups-leaders', component: EquippingGroupsLeadersComponent },
  { path: 'equipping-groups-churches', component: EquippingGroupsChurchesComponent },
  { path: 'coaching-with-impact', component: CoachingWithImpactComponent },
  { path: 'lunch-and-learns', component: LunchAndLearnComponent },
  {
    path: 'lunch-and-learn-form', component: FormPageComponent,
    data: {
      formId: 'pgo4i6DO4Fnhc8KmqzWa',
      submitButtonText: 'Request to Book a Lunch and Learn',
      currentPageName: 'Lunch and Learn Request Form',
      previousLinkName: 'Lunch and Learn',
      previousLink: '/lunch-and-learns',
      columnClass: 'col-xl-6 col-lg-6'
    } as FormPageData
  },
  { path: 'private-policy', component: PrivatePolicyComponent },
  { path: 'terms', component: TermsOfServiceComponent },
  { path: 'customer-reviews', component: CustomerReviewsComponent },
  {
    path: 'consultation-survey', component: FormPageComponent,
    data: {
      formId: '9qzHMji0Lc1LtVvgAZpk',
      submitButtonText: 'Submit Free Consultation',
      currentPageName: 'Consultation Survey',
      previousLinkName: 'Equipping Groups',
      previousLink: '/equipping-groups',
      columnClass: 'col-xl-10 col-lg-10'
    } as FormPageData
  },
  { path: 'monthly-newsletter', component: MonthlyNewsletterComponent },
  { path: 'monthly-newsletter/:id', component: NewsletterViewComponent },
  { path: 'prayer-team', component: PrayerTeamComponent }
];

@NgModule({
  declarations: [
    AboutUsComponent,
    ContactComponent,
    NewsletterComponent,
    GiveComponent,
    SeminarsComponent,
    FormPageComponent,
    EquippingGroupsComponent,
    EquippingGroupsPastorsComponent,
    EquippingGroupsLeadersComponent,
    EquippingGroupsChurchesComponent,
    CoachingWithImpactComponent,
    LunchAndLearnComponent,
    PrivatePolicyComponent,
    TermsOfServiceComponent,
    CustomerReviewsComponent,
    MonthlyNewsletterComponent,
    NewsletterViewComponent,
    PrayerTeamComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    YouTubePlayerModule,
    RouterModule.forChild(routes)
  ]
})
export class ContentFeatureModule { }
