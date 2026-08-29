import { Component, Input } from '@angular/core';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PAGE_SECTION_TYPES } from '@impact-common/shared/lists/page_section_types.enum';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';

/**
 * Renders ONE section of the Contact page, whichever type it is.
 *
 * NO STYLESHEET, deliberately: every class this page uses (`contact__info`,
 * `contact__form`, the Bootstrap grid) comes from the global theme, so
 * nothing had to move when the markup did.
 *
 * A type this build does not recognise renders NOTHING rather than failing -
 * the data outlives the build.
 */
@Component({
    selector: 'app-contact-section',
    templateUrl: './contact-section.component.html',
    standalone: false
})
export class ContactSectionComponent {
  @Input({ required: true }) block!: PageContentBlock;

  /**
   * Which form a FORM section shows. Stays in the page rather than in
   * page_content: an id retyped into a text box is a blank widget nobody can
   * diagnose. The words around the form are editable.
   */
  @Input() formId = '';

  readonly types = PAGE_SECTION_TYPES;

  /** The address, phone, email and social links - one home, in the site
   *  details, not a second copy in page content. */
  readonly impactDisciplesInfo = impactDisciplesInfo;
}
