import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './core/home/home.component';
import { EventsComponent } from './core/pages/events/events.component';
import { TeamComponent } from './core/pages/team/team.component';
import { EventDetailsComponent } from './core/pages/events/event-details/event-details.component';
import { CheckoutSuccessComponent } from './core/store/checkout-success/checkout-success.component';
import { ContactComponent } from './core/pages/contact/contact.component';
import { NewsletterComponent } from './core/pages/newsletter/newsletter.component';
import { PrivatePolicyComponent } from './core/pages/private-policy/private-policy.component';
import { TermsOfServiceComponent } from './core/pages/terms-of-service/terms-of-service.component';
import { GiveComponent } from './core/pages/give/give.component';
import { SeminarsComponent } from './core/pages/seminars/seminars.component';
import { EquippingGroupsChurchesComponent } from './core/pages/equipping-groups/equipping-groups-pastors/equipping-groups-churches.component';
import { CoachingWithImpactComponent } from './core/pages/coaching-with-impact/coaching-with-impact.component';
import { LunchAndLearnComponent } from './core/pages/lunch-and-learn/lunch-and-learn.component';
import { ShoppingCartComponent } from './core/store/shopping-cart/shopping-cart.component';
import { CheckoutComponent } from './core/store/checkout/checkout.component';
import { LunchAndLearnFormComponent } from './core/pages/lunch-and-learn/lunch-and-learn-form/lunch-and-learn-form.component';
import { SeminarFormComponent } from './core/pages/seminars/seminar-form/seminar-form.component';
import { ConsultationSurveyComponent } from './core/pages/consultation-survey/consultation-survey.component';
import { AccountComponent } from './core/pages/account/account.component';
import { BlogComponent } from './core/pages/dmms/dmm.component';
import { EBooksComponent } from './core/pages/e-books/e-books.component';
import { PodcastsComponent } from './core/pages/podcasts/podcasts.component';
import { PrayerTeamComponent } from './core/pages/prayer-team/prayer-team.component';
import { StoreComponent } from './core/pages/store/store.component';
import { TeamDetailsComponent } from './core/pages/team/team-details/team-details.component';
import { ProductDetailsComponent } from './core/pages/product-details/product-details.component';
import { SummitComponent } from './core/pages/summit/summit.component';
import { AboutUsComponent } from './core/pages/about-us/about-us.component';
import { CustomerReviewsComponent } from './core/pages/customer-reviews/customer-reviews.component';
import { MonthlyNewsletterComponent } from './core/pages/monthly-newsletter/monthly-newsletter.component';
import { SummitPreviewComponent } from './core/pages/summit-preview/summit-preview.component';
import { ScheduleComponent } from './core/pages/schedule/schedule.component';
import { EquippingGroupsPastorsComponent } from './core/pages/equipping-groups/equipping-groups-churches/equipping-groups-pastors.component';
import { EquippingGroupsLeadersComponent } from './core/pages/equipping-groups/equipping-groups-leaders/equipping-groups-leaders.component';
import { EquippingGroupsComponent } from './core/pages/equipping-groups/equipping-groups.component';

//TODO: Clean this up...sort routes into respective modules
const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'summit-preview/:year',
    component: SummitPreviewComponent
  },
  {
    path: 'events',
    component: EventsComponent
  },
  {
    path: 'event-details/:id',
    component: EventDetailsComponent
  },
  {
    path: 'events/:event-id/registrations/:registration-id',
    component: ScheduleComponent
  },
  {
    path: 'team',
    component: TeamComponent
  },
  {
    path: 'team-details/:id',
    component: TeamDetailsComponent
  },
  {
    path: 'about-us',
    component: AboutUsComponent
  },
  {
    path: 'contact',
    component: ContactComponent
  },
  {
    path: 'newsletter',
    component: NewsletterComponent
  },
  {
    path: 'give',
    component: GiveComponent
  },
  {
    path: 'seminars',
    component: SeminarsComponent
  },
  {
    path: 'seminar-form',
    component: SeminarFormComponent
  },
  {
    path: 'equipping-groups',
    component: EquippingGroupsComponent
  },
  {
    path: 'equipping-groups-pastors',
    component: EquippingGroupsPastorsComponent
  },
  {
    path: 'equipping-groups-leaders',
    component: EquippingGroupsLeadersComponent
  },
  {
    path: 'equipping-groups-churches',
    component: EquippingGroupsChurchesComponent
  },
  {
    path: 'coaching-with-impact',
    component: CoachingWithImpactComponent
  },
  {
    path:'lunch-and-learns',
    component: LunchAndLearnComponent
  },
  {
    path:'lunch-and-learn-form',
    component: LunchAndLearnFormComponent
  },
  {
    path: 'private-policy',
    component: PrivatePolicyComponent
  },
  {
    path: 'terms',
    component: TermsOfServiceComponent
  },
  {
    path: 'customer-reviews',
    component: CustomerReviewsComponent
  },
  {
    path: 'store',
    component: StoreComponent
  },
  {
    path: 'spanish-resources',
    component: StoreComponent,
    data: { catagory: 'Espanol Resources' }
  },
  {
    path: 'product-details/:id',
    component: ProductDetailsComponent
  },
  {
    path: 'shopping-cart',
    component: ShoppingCartComponent
  },
  {
    path: 'checkout',
    component: CheckoutComponent
  },
  {
    path: 'checkout-success',
    component: CheckoutSuccessComponent
  },
  {
    path: 'consultation-survey',
    component: ConsultationSurveyComponent
  },
  {
    path: 'account',
    component: AccountComponent
  },
  {
    path: 'disciple-making-minute',
    component: BlogComponent
  },
  {
    path: 'monthly-newsletter',
    component: MonthlyNewsletterComponent
  },
  {
    path: 'e-books',
    component: EBooksComponent
  },
  {
    path: 'podcasts',
    component: PodcastsComponent
  },
  {
    path: 'prayer-team',
    component: PrayerTeamComponent
  },
  {
    path: 'summit/:year',
    component: SummitComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
