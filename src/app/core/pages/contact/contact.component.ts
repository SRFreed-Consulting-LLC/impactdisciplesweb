import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { liveSections } from 'src/app/shared/utils/page-sections';

/**
 * Contact - an ordered stack of sections read from `page_content/contact`.
 *
 * ORDER HERE IS LEFT TO RIGHT, not top to bottom: this page is one row of
 * two halves, so the first section is the left column and the second is the
 * right. Swapping them in Page Manager swaps the sides. It is the one page
 * whose stack is horizontal, and the admin screen says so.
 *
 * The form is backed by app-dynamic-form (src/app/shared/form-renderer/),
 * the same pattern as the Seminar and Lunch-and-Learn request forms. The
 * original dx-form here had NO submit handler wired up anywhere - clicking
 * "Send Message" did nothing at all - so that swap was the first time this
 * form ever worked.
 *
 * NO FALLBACK - see seminars.component.ts.
 */
@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    standalone: false
})
export class ContactComponent {
  /** The ordered sections this page draws. Empty until the read lands. */
  readonly sections$: Observable<PageContentBlock[]>;

  // Points at the real "Contact Us" FormDefinitionModel in the
  // impactdisciplesdev project's `forms` collection (Name/Email side by side,
  // Subject and Message full-width, all four required). Editable in the admin
  // app's Form Builder, same as every other formId here - and deliberately
  // NOT in page_content: an id retyped into a text box is a blank widget
  // nobody can diagnose.
  readonly formId = 'N0ynW6zeYKdXQS2EkBii';

  constructor(pageContent: PageContentService) {
    this.sections$ = pageContent.forPage('contact').pipe(map(liveSections));
  }
}
