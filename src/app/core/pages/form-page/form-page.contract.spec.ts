import { routes as CONTENT_ROUTES_FOR_TEST } from '../../content.module';
import { FormPageComponent, FormPageData } from './form-page.component';

// Characterization suite for the form pages (bucket A, web item 2).
//
// Written BEFORE the merge against the three components' own `formId`
// constants, and retargeted here at the route config once those components
// collapsed into FormPageComponent. The VALUE TABLE below is byte-identical
// to the pre-merge version - that is the point: where the values live
// changed, what they are did not.
//
// Why pin them at all: each form id is a document id in the `forms`
// Firestore collection. A typo or a dropped id breaks a live public page
// silently - no compile error, no failing build, the page just renders an
// empty form. Route data is even easier to fat-finger than a constant was.
//
// Verified 2026-08-21 against BOTH projects: all three ids exist in
// impactdisciplesdev AND impactdisciples-a82a8 with identical document ids
// (`forms` is the same five documents in each). The three components used
// to carry a comment claiming these ids were dev-only and "NOT portable to
// production as-is"; that was false and was not carried over.
const EXPECTED_FORM_PAGES: Record<string, FormPageData> = {
  'seminar-form': {
    formId: 'SEp1UJlYaFDz50Nfe5Hh',
    submitButtonText: 'Request to Book a Seminar',
    currentPageName: 'Seminar Request Form',
    previousLinkName: 'Seminars',
    previousLink: '/seminars',
    columnClass: 'col-xl-8 col-lg-8'
  },
  'lunch-and-learn-form': {
    formId: 'pgo4i6DO4Fnhc8KmqzWa',
    submitButtonText: 'Request to Book a Lunch and Learn',
    currentPageName: 'Lunch and Learn Request Form',
    previousLinkName: 'Lunch and Learn',
    previousLink: '/lunch-and-learns',
    columnClass: 'col-xl-6 col-lg-6'
  },
  'consultation-survey': {
    formId: '9qzHMji0Lc1LtVvgAZpk',
    submitButtonText: 'Submit Free Consultation',
    currentPageName: 'Consultation Survey',
    previousLinkName: 'Equipping Groups',
    previousLink: '/equipping-groups',
    columnClass: 'col-xl-10 col-lg-10'
  }
};

describe('form pages', () => {
  for (const [path, expected] of Object.entries(EXPECTED_FORM_PAGES)) {
    it(`/${path} renders its own form with its own copy`, () => {
      const route = CONTENT_ROUTES_FOR_TEST.find(r => r.path === path);

      expect(route)
        .withContext(`route /${path} is missing entirely`)
        .toBeDefined();
      expect(route!.component).toBe(FormPageComponent);
      expect(route!.data).toEqual(expected as never);
    });
  }

  it('every form page points at a distinct form', () => {
    // Adding a page by copying a route entry and forgetting to change the
    // id would silently serve the wrong form on a live page.
    const ids = Object.values(EXPECTED_FORM_PAGES).map(p => p.formId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exposes route data reactively rather than from a stale snapshot', () => {
    // One component class serves three routes now, so reading
    // route.snapshot once would be wrong if the router ever reused the
    // component between them.
    const data = { formId: 'x' } as never;
    const component = new FormPageComponent({ data } as never);

    expect(component.page$).toBe(data);
  });
});
