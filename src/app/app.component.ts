import { Component, HostBinding } from '@angular/core';
import { ScreenService } from 'src/app/common/services/utils/screen.service';
import { AttributionService } from 'src/app/shared/utils/services/attribution.service';

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

  // AttributionService is injected purely to run its constructor at
  // bootstrap - it captures ?cid/&ceid from campaign links BEFORE the
  // router's first navigation can rewrite the query string (see the
  // service's own comment). A private field keeps the reference (and the
  // lint) honest about why it exists.
  constructor(private screen: ScreenService, private attribution: AttributionService) {
    void this.attribution;
  }


}
