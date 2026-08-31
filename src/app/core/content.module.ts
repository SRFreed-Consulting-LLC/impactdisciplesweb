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
import { CoachingWithImpactComponent } from "./pages/coaching-with-impact/coaching-with-impact.component";
import { DiscipleshipLibraryComponent } from "./pages/discipleship-library/discipleship-library.component";
import { PrivatePolicyComponent } from "./pages/private-policy/private-policy.component";
import { TermsOfServiceComponent } from "./pages/terms-of-service/terms-of-service.component";
import { CustomerReviewsComponent } from "./pages/customer-reviews/customer-reviews.component";
import { MonthlyNewsletterComponent } from "./pages/monthly-newsletter/monthly-newsletter.component";
import { NewsletterViewComponent } from "./pages/monthly-newsletter/newsletter-view/newsletter-view.component";
import { PrayerTeamComponent } from "./pages/prayer-team/prayer-team.component";
// One SECTION renderer per page. Every wired page is a dispatcher now: it
// loops over the ordered sections in its page_content document and hands each
// one to its page's section component, which is the only thing that knows how
// a type maps onto that page's markup. They are separate per page on purpose -
// a `mission` is a dark band on About Us and a light two-up on the equipping
// pages, and one component drawing both would be a switch inside a switch.
import { SeminarsSectionComponent } from "./pages/seminars/seminars-section/seminars-section.component";
import { GiveSectionComponent } from "./pages/give/give-section/give-section.component";
import { ContactSectionComponent } from "./pages/contact/contact-section/contact-section.component";
import { LibrarySectionComponent } from "./pages/discipleship-library/library-section/library-section.component";
import { PrayerSectionComponent } from "./pages/prayer-team/prayer-section/prayer-section.component";
import { CoachingSectionComponent } from "./pages/coaching-with-impact/coaching-section/coaching-section.component";

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
  { path: 'coaching-with-impact', component: CoachingWithImpactComponent,
    title: 'Coaching with Impact' },
  { path: 'discipleship-library', component: DiscipleshipLibraryComponent,
    title: 'The Impact Discipleship Library App' },
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
    CoachingWithImpactComponent,
    DiscipleshipLibraryComponent,
    PrivatePolicyComponent,
    TermsOfServiceComponent,
    CustomerReviewsComponent,
    MonthlyNewsletterComponent,
    NewsletterViewComponent,
    PrayerTeamComponent,
    SeminarsSectionComponent,
    GiveSectionComponent,
    ContactSectionComponent,
    LibrarySectionComponent,
    PrayerSectionComponent,
    CoachingSectionComponent
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
