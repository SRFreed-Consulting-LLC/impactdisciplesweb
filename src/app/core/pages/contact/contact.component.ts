import { Component } from '@angular/core';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';

// Now backed by app-dynamic-form (src/app/shared/form-renderer/), same
// pattern as SeminarFormComponent/LunchAndLearnFormComponent - see
// seminar-form.component.ts's own comment for the full explanation. The
// original dx-form here had NO submit handler wired up anywhere (clicking
// "Send Message" did nothing at all), so this isn't just a UI swap, it's
// the first time this form has ever actually worked.
//
// TODO: formId below is a placeholder. A "Contact Us" FormDefinitionModel
// (fields: name/email/subject/message, all required, matching the old
// dx-form's dataFields) needs to be created in the impactdisciplesdev
// project's `forms` collection via impactdisciples-admin's Web Manager >
// Form Builder before this will actually render anything - creating it
// directly via a script was blocked by this session's own write-permission
// guard against the live database. Replace this id once that form exists.
@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
    standalone: false
})
export class ContactComponent {
  public impactDisciplesInfo = impactDisciplesInfo;
  readonly formId = 'REPLACE_WITH_CONTACT_US_FORM_ID';
}
