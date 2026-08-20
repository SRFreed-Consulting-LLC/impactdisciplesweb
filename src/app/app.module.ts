import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from 'src/environments/environment';
import { CookieService } from 'ngx-cookie-service';
import { SharedModule } from './shared/shared.module';
import { GlobalErrorHandler } from './core/global-error-handler';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule
  ],
  providers: [
    CookieService,
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    // Connects to the local Emulator Suite when built with the `emulator`
    // configuration (see environment.emulator.ts) - the emulator stack is
    // owned/started by the admin repo (its firebase.json); port 8080 matches
    // its emulators block. Cloud Function calls need no equivalent here:
    // this app calls functions by URL, and the emulator environment file
    // rewrites every URL to 127.0.0.1:5001.
    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment.useEmulators) {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
      }
      return firestore;
    }),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
