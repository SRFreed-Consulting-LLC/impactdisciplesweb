import { Component, HostBinding, OnInit } from '@angular/core';
import { ScreenService } from 'src/app/common/services/utils/screen.service';
import { AttributionService } from 'src/app/shared/utils/services/attribution.service';
import { FrameHeightService } from 'src/app/shared/utils/services/frame-height.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: false
})
export class AppComponent implements OnInit {
  title = 'impactdisciplesweb';

  @HostBinding('class') get getClass() {
    return Object.keys(this.screen.sizes).filter(cl => this.screen.sizes[cl]).join(' ');
  }

  // AttributionService is injected purely to run its constructor at
  // bootstrap - it captures ?cid/&ceid from campaign links BEFORE the
  // router's first navigation can rewrite the query string (see the
  // service's own comment). A private field keeps the reference (and the
  // lint) honest about why it exists.
  constructor(
    private screen: ScreenService,
    private attribution: AttributionService,
    private frameHeight: FrameHeightService
  ) {
    void this.attribution;
  }

  ngOnInit(): void {
    // Reports this page's height to a parent window, and ONLY when there is
    // one - Page Manager's previewer shows the real site in a scaled frame
    // and cannot measure it across origins. A normal visit does nothing.
    this.frameHeight.start();
  }
}
