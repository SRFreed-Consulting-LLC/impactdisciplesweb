import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

// One page shell for every "render a Form Builder form" route (bucket A,
// web item 2, 2026-08-21). Replaces SeminarFormComponent,
// LunchAndLearnFormComponent and ConsultationSurveyComponent, which were
// the same 19-line template three times over, differing only in the values
// below.
//
// The forms themselves are authored in the sibling impactdisciples-admin
// app's Form Builder and live in the `forms` Firestore collection;
// app-dynamic-form (src/app/shared/form-renderer/) does the rendering and
// the submit. This component's only job is knowing WHICH form a route
// wants, which is now route data rather than a hardcoded constant - so
// adding another form page is a route entry, not another component.
//
// On the form ids: the three components this replaces each carried a
// comment warning that their id was an impactdisciplesdev document id and
// was "NOT portable to production as-is". That was checked on 2026-08-21
// and is not true - all three ids exist in BOTH projects with identical
// document ids (the `forms` collection is the same five documents in
// each), so the warnings were removed rather than carried over. If that
// ever stops being true the fix belongs here, in route data, per
// environment.

/** Route `data` shape for a form page. */
export interface FormPageData {
  /** Document id in the `forms` collection. */
  formId: string;
  submitButtonText: string;
  currentPageName: string;
  previousLinkName: string;
  previousLink: string;
  /** Bootstrap column classes - these pages are 6, 8 and 10 wide. */
  columnClass: string;
}

@Component({
    selector: 'app-form-page',
    templateUrl: './form-page.component.html',
    standalone: false
})
export class FormPageComponent {
  // Taken as an observable rather than route.snapshot: one component class
  // now serves three routes, and reading data reactively stays correct
  // whatever the router's reuse behaviour is. The async pipe also means no
  // subscription to tear down.
  //
  // Typed as FormPageData rather than the router's own `Data`, which is an
  // index signature - under strict templates that forces every binding to
  // be written page['formId'] instead of page.formId. The cast is the
  // single place this route contract is asserted; the shape itself is
  // pinned by form-page.contract.spec.ts against the real route table.
  readonly page$: Observable<FormPageData> = this.route.data as Observable<FormPageData>;

  constructor(private route: ActivatedRoute) {}
}
