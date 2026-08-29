import { Component } from '@angular/core';
import { EquippingGroupsPageBase } from '../equipping-groups-page.base';

@Component({
    selector: 'app-equipping-groups-churches',
    templateUrl: './equipping-groups-churches.component.html',
    styleUrls: ['../equipping-groups-page.shared.scss'],
    standalone: false
})
export class EquippingGroupsChurchesComponent extends EquippingGroupsPageBase {
  protected readonly pageSlug = 'equipping-groups-churches';
}
