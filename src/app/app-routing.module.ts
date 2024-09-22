import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CapturePasswordFormComponent } from 'impactdisciplescommon/src/forms/capture-password-form/capture-password-form.component';
import { CaptureUsernameFormComponent } from 'impactdisciplescommon/src/forms/capture-username-form/capture-username-form.component';
import { ChangePasswordFormComponent } from 'impactdisciplescommon/src/forms/change-password-form/change-password-form.component';
import { CreateAuthFormComponent } from 'impactdisciplescommon/src/forms/create-auth-form/create-auth-form.component';
import { ResetPasswordFormComponent } from 'impactdisciplescommon/src/forms/reset-password-form/reset-password-form.component';
import { AuthGuardService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { HomeComponent } from './core/home/home.component';
import { EventsComponent } from './core/pages/events/events.component';
import { TeamComponent } from './core/pages/team/team.component';
import { EventDetailsComponent } from './core/pages/events/event-details/event-details.component';
import { CheckoutSuccessComponent } from './core/store/checkout-success/checkout-success.component';
import { HistoryComponent } from './core/pages/history/history.component';
import { ContactComponent } from './core/pages/contact/contact.component';
import { NewsletterComponent } from './core/pages/newsletter/newsletter.component';
import { PrivatePolicyComponent } from './core/pages/private-policy/private-policy.component';
import { TermsOfServiceComponent } from './core/pages/terms-of-service/terms-of-service.component';
import { GiveComponent } from './core/pages/give/give.component';
import { SeminarsComponent } from './core/pages/seminars/seminars.component';
import { EquippingGroupsComponent } from './core/pages/equipping-groups/equipping-groups.component';
import { CoachingWithImpactComponent } from './core/pages/coaching-with-impact/coaching-with-impact.component';
import { LunchAndLearnComponent } from './core/pages/lunch-and-learn/lunch-and-learn.component';
import { ShoppingCartComponent } from './core/store/shopping-cart/shopping-cart.component';
import { CheckoutComponent } from './core/store/checkout/checkout.component';
import { LunchAndLearnFormComponent } from './core/pages/lunch-and-learn/lunch-and-learn-form/lunch-and-learn-form.component';
import { SeminarFormComponent } from './core/pages/seminars/seminar-form/seminar-form.component';
import { ConsultationSurveyComponent } from './core/pages/consultation-survey/consultation-survey.component';
import { AccountComponent } from './core/pages/account/account.component';
import { BlogComponent } from './core/pages/blog/blog.component';
import { EBooksComponent } from './core/pages/e-books/e-books.component';
import { PodcastsComponent } from './core/pages/podcasts/podcasts.component';
import { PrayerTeamComponent } from './core/pages/prayer-team/prayer-team.component';
import { StoreComponent } from './core/pages/store/store.component';
import { TeamDetailsComponent } from './core/pages/team/team-details/team-details.component';
import { BlogDetailsComponent } from './core/pages/blog-details/blog-details.component';
import { RegistrationComponent } from './core/registration/registration.component';
import { RegistrationCheckoutComponent } from './core/registration-checkout/registration-checkout.component';
import { RegistrationCheckoutSuccessComponent } from './core/registration-checkout-success/registration-checkout-success.component';
import { ProductDetailsComponent } from './core/pages/product-details/product-details.component';

//TODO: Clean this up...sort routes into respective modules
const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'register',
    component: RegistrationComponent
  },
  {
    path: 'registration-checkout',
    component: RegistrationCheckoutComponent
  },
  {
    path: 'registration-checkout-success',
    component: RegistrationCheckoutSuccessComponent
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
    path: 'team',
    component: TeamComponent
  },
  {
    path: 'team-details/:id',
    component: TeamDetailsComponent
  },
  {
    path: 'history',
    component: HistoryComponent
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
    path: 'store',
    component: StoreComponent
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
    path: 'blog',
    component: BlogComponent
  },
  {
    path: 'blog-details/:id',
    component: BlogDetailsComponent
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
    path: 'capture-username-form',
    component: CaptureUsernameFormComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'capture-password-form',
    component: CapturePasswordFormComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'create-auth-form',
    component: CreateAuthFormComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'reset-password',
    component: ResetPasswordFormComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'change-password/:recoveryCode',
    component: ChangePasswordFormComponent,
    canActivate: [ AuthGuardService ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
