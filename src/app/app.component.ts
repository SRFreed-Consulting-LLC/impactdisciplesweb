import { Component, HostBinding } from '@angular/core';
import { ScreenService } from 'impactdisciplescommon/src/services/utils/screen.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  title = 'impactdisciplesweb';

  @HostBinding('class') get getClass() {
    return Object.keys(this.screen.sizes).filter(cl => this.screen.sizes[cl]).join(' ');
  }

  constructor(private screen: ScreenService) { }


}
