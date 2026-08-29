import { Component, Input } from '@angular/core';
import { HomeSectionModel } from '@impact-common/shared/models/domain/home-section.model';
import { HOME_SECTION_TYPES } from '@impact-common/shared/lists/home_section_types.enum';

/**
 * Renders ONE home-page section, whichever type it is.
 *
 * The only thing that knows how a section record maps onto a component. The
 * home page itself just loops; adding a section type means adding a case
 * here and a member to HOME_SECTION_TYPES, and nothing else changes.
 *
 * A type this component does not recognise renders NOTHING rather than
 * failing. That matters because the data outlives the build: a section
 * created by a newer admin, or a type retired from the enum, must not take
 * the whole home page down with it.
 */
@Component({
    selector: 'app-home-section',
    templateUrl: './home-section.component.html',
    standalone: false
})
export class HomeSectionComponent {
  @Input() section!: HomeSectionModel;

  /** Exposed so the template can switch on the enum rather than on strings. */
  readonly types = HOME_SECTION_TYPES;
}
