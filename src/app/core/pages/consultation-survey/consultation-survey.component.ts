import { Component } from '@angular/core';

// Now backed by app-dynamic-form (src/app/shared/form-renderer/) - the
// "Consultation Survey" form is authored/edited in the sibling
// impactdisciples-admin app's Web Manager > Form Builder, not here. This
// component's only job is knowing which form to load.
//
// The id below is the "Consultation Survey" form's Firestore document id in
// the impactdisciplesdev project (both apps' local configs point at the
// same project - see each repo's environment.local.ts). It is NOT portable
// to production as-is: promoting this to the impactdisciples-a82a8 project
// means importing/rebuilding the form there too and updating this constant
// to that project's own doc id.
@Component({
    selector: 'app-consultation-survey',
    templateUrl: './consultation-survey.component.html',
    styleUrls: ['./consultation-survey.component.scss'],
    standalone: false
})
export class ConsultationSurveyComponent {
  readonly formId = '9qzHMji0Lc1LtVvgAZpk';
}
