import { UsersComponent } from './admin/users/users.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LogMessagesComponent } from './admin/log-messages/log-messages.component';
import { CapturePasswordFormComponent } from 'impactdisciplescommon/src/forms/capture-password-form/capture-password-form.component';
import { CaptureUsernameFormComponent } from 'impactdisciplescommon/src/forms/capture-username-form/capture-username-form.component';
import { ChangePasswordFormComponent } from 'impactdisciplescommon/src/forms/change-password-form/change-password-form.component';
import { CreateAuthFormComponent } from 'impactdisciplescommon/src/forms/create-auth-form/create-auth-form.component';
import { ResetPasswordFormComponent } from 'impactdisciplescommon/src/forms/reset-password-form/reset-password-form.component';
import { AuthGuardService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { MainScreenComponent } from './core/main-screen/main-screen.component';
import { EventManagerComponent } from './events/event-manager/event-manager.component';
import { CoachManagerComponent } from './events/coach-manager/coach-manager.component';
import { CourseManagerComponent } from './events/course-manager/course-manager.component';
import { OrganizationManagerComponent } from './events/organization-manager/organization-manager.component';
import { LocationManagerComponent } from './events/location-manager/location-manager.component';
import { EventRegistrationComponent } from './events/event-registration/event-registration.component';

const routes: Routes = [
  {
    path: '',
    component: MainScreenComponent,
    canActivate: [ AuthGuardService ],
    children: [
      {
        path: 'registration',
        component: EventRegistrationComponent,
        canActivate: [ AuthGuardService ]
      },
      {
        path: 'events',
        component: EventManagerComponent,
        canActivate: [ AuthGuardService ]
      },
      {
        path: 'coaches',
        component: CoachManagerComponent,
        canActivate: [ AuthGuardService ]
      },
      {
        path: 'courses',
        component: CourseManagerComponent,
        canActivate: [ AuthGuardService ]
      },
      {
        path: 'organizations',
        component: OrganizationManagerComponent,
        canActivate: [ AuthGuardService ]
      },
      {
        path: 'locations',
        component: LocationManagerComponent,
        canActivate: [ AuthGuardService ]
      },
      {
        path: 'users',
        component: UsersComponent,
        canActivate: [ AuthGuardService ]
      },
      {
        path: 'log-messages',
        component: LogMessagesComponent,
        canActivate: [ AuthGuardService ]
      },
    ]
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
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
