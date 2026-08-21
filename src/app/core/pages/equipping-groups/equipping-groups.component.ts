import { Component } from '@angular/core';
import { EquippingGroupsPageBase } from './equipping-groups-page.base';

@Component({
    selector: 'app-equipping-groups',
    templateUrl: './equipping-groups.component.html',
    styleUrls: ['./equipping-groups.component.scss'],
    standalone: false
})
export class EquippingGroupsComponent extends EquippingGroupsPageBase {}
