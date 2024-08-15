import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CapturePasswordFormComponent } from 'impactdisciplescommon/src/forms/capture-password-form/capture-password-form.component';
import { CaptureUsernameFormComponent } from 'impactdisciplescommon/src/forms/capture-username-form/capture-username-form.component';
import { ChangePasswordFormComponent } from 'impactdisciplescommon/src/forms/change-password-form/change-password-form.component';
import { CreateAuthFormComponent } from 'impactdisciplescommon/src/forms/create-auth-form/create-auth-form.component';
import { ResetPasswordFormComponent } from 'impactdisciplescommon/src/forms/reset-password-form/reset-password-form.component';
import { AuthGuardService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { HomeComponent } from './core/home/home.component';
import { EventRegistrationComponent } from './core/events/event-registration/event-registration.component';
import { EventFormComponent } from './core/events/event-form/event-form.component';
import { EventsComponent } from './core/pages/events/events.component';
import { CheckoutComponent } from './core/pages/checkout/checkout.component';
import { CheckoutSuccessComponent } from './core/pages/checkout-success/checkout-success.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'events',
    component: EventsComponent
  },
  {
    path: 'registration',
    component: EventRegistrationComponent
  },
  {
    path: 'event-form',
    component: EventFormComponent
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'checkoutsuccess',
    component: CheckoutSuccessComponent,
    canActivate: [ AuthGuardService ]
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
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
