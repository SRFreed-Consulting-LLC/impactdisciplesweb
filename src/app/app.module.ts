import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from 'src/environments/environment';
import { CookieService } from 'ngx-cookie-service';
import { SharedModule } from './shared/shared.module';
import { NgxsModule } from '@ngxs/store';
import { GlobalErrorHandler } from './core/global-error-handler';

// NgxsModule.forRoot() must stay registered even though this app's own
// code (schedule feature) no longer uses NgXs directly (see
// ScheduleEventBusService) -- the shared impactdisciplespwacommon
// submodule's AuthService still injects NgXs's Store for a one-off
// dispatch, and that submodule is also consumed by other apps this repo
// can't verify a fix against. Removing this would break DI for that
// service at runtime.
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxsModule.forRoot([], { developmentMode: !environment.production }),
    SharedModule
  ],
  providers: [
    CookieService,
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
