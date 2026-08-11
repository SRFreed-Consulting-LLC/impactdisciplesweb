import { Component } from '@angular/core';

// Now backed by app-dynamic-form (src/app/shared/form-renderer/) - the
// "Lunch and Learn Request" form is authored/edited in the sibling
// impactdisciples-admin app's Web Manager > Form Builder, not here. See
// consultation-survey.component.ts for the full explanation of this
// pattern (same one, second use).
//
// The id below is this form's Firestore document id in the
// impactdisciplesdev project - not portable to production as-is, same
// caveat as Consultation Survey's own formId.
@Component({
    selector: 'app-lunch-and-learn-form',
    templateUrl: './lunch-and-learn-form.component.html',
    styleUrls: ['./lunch-and-learn-form.component.scss'],
    standalone: false
})
export class LunchAndLearnFormComponent {
  readonly formId = 'pgo4i6DO4Fnhc8KmqzWa';
}
