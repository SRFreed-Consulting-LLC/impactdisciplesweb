import { Component } from '@angular/core';
import { EquippingGroupsPageBase } from '../equipping-groups-page.base';

@Component({
    selector: 'app-equipping-groups-pastors',
    templateUrl: './equipping-groups-pastors.component.html',
    styleUrls: ['../equipping-groups-page.shared.scss'],
    standalone: false
})
export class EquippingGroupsPastorsComponent extends EquippingGroupsPageBase {
  protected readonly pageSlug = 'equipping-groups-pastors';
}
