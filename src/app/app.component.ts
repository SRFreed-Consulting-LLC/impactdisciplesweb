import { Component, HostBinding } from '@angular/core';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { ScreenService } from 'impactdisciplescommon/src/services/utils/screen.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'impactdisciplesweb';

  @HostBinding('class') get getClass() {
    return Object.keys(this.screen.sizes).filter(cl => this.screen.sizes[cl]).join(' ');
  }

  constructor(private authService: AuthService, private screen: ScreenService) { }

  isAuthenticated() {
    return this.authService.loggedIn;
  }
}
