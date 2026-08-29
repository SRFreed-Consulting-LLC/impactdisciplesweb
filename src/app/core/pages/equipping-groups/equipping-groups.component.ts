import { Component } from '@angular/core';
import { EquippingGroupsPageBase } from './equipping-groups-page.base';

// No styleUrls: every rule these pages use is for markup that now lives in
// app-equipping-section, and with emulated encapsulation a stylesheet only
// reaches the component that renders the element. The rules moved with the
// markup; the page keeps only the `.equipping-groups` wrapper, which has no
// properties of its own.
@Component({
    selector: 'app-equipping-groups',
    templateUrl: './equipping-groups-page.shared.html',
    standalone: false
})
export class EquippingGroupsComponent extends EquippingGroupsPageBase {
  protected readonly pageSlug = 'equipping-groups';
}
