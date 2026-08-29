import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormPageComponent, FormPageData } from "./pages/form-page/form-page.component";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { YouTubePlayerModule } from '@angular/youtube-player';
import { SharedModule } from "../shared/shared.module";
import { FormRendererModule } from "../shared/form-renderer/form-renderer.module";
import { AboutUsComponent } from "./pages/about-us/about-us.component";
import { AboutSectionComponent } from "./pages/about-us/about-section/about-section.component";
import { ContactComponent } from "./pages/contact/contact.component";
import { NewsletterComponent } from "./pages/newsletter/newsletter.component";
import { GiveComponent } from "./pages/give/give.component";
import { SeminarsComponent } from "./pages/seminars/seminars.component";
import { EquippingGroupsComponent } from "./pages/equipping-groups/equipping-groups.component";
import { EquippingGroupsPastorsComponent } from "./pages/equipping-groups/equipping-groups-pastors/equipping-groups-pastors.component";
import { EquippingGroupsLeadersComponent } from "./pages/equipping-groups/equipping-groups-leaders/equipping-groups-leaders.component";
import { EquippingGroupsChurchesComponent } from "./pages/equipping-groups/equipping-groups-churches/equipping-groups-churches.component";
import { CoachingWithImpactComponent } from "./pages/coaching-with-impact/coaching-with-impact.component";
import { DiscipleshipLibraryComponent } from "./pages/discipleship-library/discipleship-library.component";
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
  { path: 'about-us', component: AboutUsComponent,
    title: 'About Us' },
  { path: 'contact', component: ContactComponent,
    title: 'Contact' },
  { path: 'newsletter', component: NewsletterComponent,
    title: 'Newsletter' },
  { path: 'give', component: GiveComponent,
    title: 'Donate' },
  { path: 'seminars', component: SeminarsComponent,
    title: 'Seminars' },
  {
    path: 'seminar-form', component: FormPageComponent,
    title: 'Seminar Request Form',
    data: {
      formId: 'SEp1UJlYaFDz50Nfe5Hh',
      submitButtonText: 'Request to Book a Seminar',
      currentPageName: 'Seminar Request Form',
      previousLinkName: 'Seminars',
      previousLink: '/seminars',
      columnClass: 'col-xl-8 col-lg-8'
    } as FormPageData
  },
  { path: 'equipping-groups', component: EquippingGroupsComponent,
    title: 'Equipping Groups' },
  { path: 'equipping-groups-pastors', component: EquippingGroupsPastorsComponent,
    title: 'Equipping Groups for Pastors' },
  { path: 'equipping-groups-leaders', component: EquippingGroupsLeadersComponent,
    title: 'Equipping Groups for Leaders' },
  { path: 'equipping-groups-churches', component: EquippingGroupsChurchesComponent,
    title: 'Equipping Groups for Churches' },
  { path: 'coaching-with-impact', component: CoachingWithImpactComponent,
    title: 'Coaching with Impact' },
  { path: 'discipleship-library', component: DiscipleshipLibraryComponent,
    title: 'The Impact Discipleship Library App' },
  { path: 'lunch-and-learns', component: LunchAndLearnComponent,
    title: 'Lunch and Learns' },
  {
    path: 'lunch-and-learn-form', component: FormPageComponent,
    title: 'Lunch and Learn Request Form',
    data: {
      formId: 'pgo4i6DO4Fnhc8KmqzWa',
      submitButtonText: 'Request to Book a Lunch and Learn',
      currentPageName: 'Lunch and Learn Request Form',
      previousLinkName: 'Lunch and Learn',
      previousLink: '/lunch-and-learns',
      columnClass: 'col-xl-6 col-lg-6'
    } as FormPageData
  },
  { path: 'private-policy', component: PrivatePolicyComponent,
    title: 'Private Policy' },
  { path: 'terms', component: TermsOfServiceComponent,
    title: 'Terms of Service' },
  { path: 'customer-reviews', component: CustomerReviewsComponent,
    title: 'Customer Reviews' },
  {
    path: 'consultation-survey', component: FormPageComponent,
    title: 'Consultation Survey',
    data: {
      formId: '9qzHMji0Lc1LtVvgAZpk',
      submitButtonText: 'Submit Free Consultation',
      currentPageName: 'Consultation Survey',
      previousLinkName: 'Equipping Groups',
      previousLink: '/equipping-groups',
      columnClass: 'col-xl-10 col-lg-10'
    } as FormPageData
  },
  { path: 'monthly-newsletter', component: MonthlyNewsletterComponent,
    title: 'Monthly Newsletter' },
  { path: 'monthly-newsletter/:id', component: NewsletterViewComponent },
  { path: 'prayer-team', component: PrayerTeamComponent,
    title: 'Prayer Team' }
];

@NgModule({
  declarations: [
    AboutUsComponent,
    AboutSectionComponent,
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
    DiscipleshipLibraryComponent,
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
    FormRendererModule,
    YouTubePlayerModule,
    RouterModule.forChild(routes)
  ]
})
export class ContentFeatureModule { }
