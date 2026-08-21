import { Component } from '@angular/core';
import { EquippingGroupsPageBase } from '../equipping-groups-page.base';

@Component({
    selector: 'app-equipping-groups-leaders',
    templateUrl: './equipping-groups-leaders.component.html',
    styleUrls: ['../equipping-groups-page.shared.scss'],
    standalone: false
})
export class EquippingGroupsLeadersComponent extends EquippingGroupsPageBase {}
