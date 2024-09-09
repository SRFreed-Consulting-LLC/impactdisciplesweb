import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from 'src/environments/environment';
import { ToastrModule } from 'ngx-toastr';
import { ImpactDisciplesModule } from 'impactdisciplescommon/src/impactdisciples.common.module';
import { CoreModule } from './core/core.module';
import { CookieService } from 'ngx-cookie-service';
import { SharedModule } from './shared/shared.module';
import { ThemeSharedModule } from './theme/shared/theme-shared.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    ToastrModule.forRoot(),
    CoreModule,
    SharedModule,
    ThemeSharedModule,
    ImpactDisciplesModule

  ],
  providers: [
    CookieService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
