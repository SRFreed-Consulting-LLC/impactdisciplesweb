import { Component } from '@angular/core';

// Now backed by app-dynamic-form (src/app/shared/form-renderer/) - the
// "Seminar Request" form is authored/edited in the sibling
// impactdisciples-admin app's Web Manager > Form Builder, not here. See
// consultation-survey.component.ts for the full explanation of this
// pattern (same one, third use).
//
// Note: the original's "Preferred Trainer" field was a live dxAutocomplete
// bound to the Coaches collection - this builder has no dynamic/live-data
// option source yet, so it was imported as a plain text field instead (see
// the dynamic-form-wiring-gotchas memory note). Everything else about this
// form's layout (the colCount=6 grid) was reproduced via 'columns' fields.
//
// The id below is this form's Firestore document id in the
// impactdisciplesdev project - not portable to production as-is, same
// caveat as Consultation Survey's own formId.
@Component({
    selector: 'app-seminar-form',
    templateUrl: './seminar-form.component.html',
    styleUrls: ['./seminar-form.component.scss'],
    standalone: false
})
export class SeminarFormComponent {
  readonly formId = 'SEp1UJlYaFDz50Nfe5Hh';
}
