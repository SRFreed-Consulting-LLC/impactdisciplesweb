import { Component, Input } from '@angular/core';
import { HomeSectionItem } from '@impact-common/shared/models/domain/home-section.model';
import defaultServices from 'src/app/shared/utils/data/home-services-data';

/**
 * The strip of service cards under the slider.
 *
 * `items` defaults to what the page has always shown, so a `services`
 * section carrying none of its own still renders something.
 *
 * Switched-off cards are filtered here rather than by the caller: the
 * section record holds every card staff have written, including the ones
 * they have turned off, and only this component knows a visitor should not
 * see those.
 */
@Component({
    selector: 'app-home-services',
    templateUrl: './home-services.component.html',
    styleUrls: ['./home-services.component.scss'],
    standalone: false
})
export class HomeServicesComponent {
  @Input() items: HomeSectionItem[] = defaultServices;

  get visibleItems(): HomeSectionItem[] {
    return (this.items ?? []).filter((item) => item.isActive);
  }
}
