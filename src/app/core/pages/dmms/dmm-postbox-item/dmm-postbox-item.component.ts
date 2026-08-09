import { Component, Input } from '@angular/core';
import { DMMModel } from 'src/app/common/models/domain/dmm.model';

@Component({
    selector: 'app-dmm-postbox-item',
    templateUrl: './dmm-postbox-item.component.html',
    styleUrls: ['./dmm-postbox-item.component.scss'],
    standalone: false
})
export class BlogPostboxItemComponent {
  @Input() blog!: DMMModel;
}
