import { Component } from '@angular/core';
import { EquippingGroupsPageBase } from '../equipping-groups-page.base';

// See equipping-groups.component.ts for why there are no styleUrls here.
@Component({
    selector: 'app-equipping-groups-churches',
    templateUrl: '../equipping-groups-page.shared.html',
    standalone: false
})
export class EquippingGroupsChurchesComponent extends EquippingGroupsPageBase {
  protected readonly pageSlug = 'equipping-groups-churches';
}
