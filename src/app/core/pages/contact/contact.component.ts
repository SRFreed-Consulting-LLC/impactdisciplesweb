import { Component } from '@angular/core';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import { Observable } from 'rxjs';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PageContentService } from 'src/app/common/services/data/page-content.service';

// Now backed by app-dynamic-form (src/app/shared/form-renderer/), same
// pattern as SeminarFormComponent/LunchAndLearnFormComponent - see
// seminar-form.component.ts's own comment for the full explanation. The
// original dx-form here had NO submit handler wired up anywhere (clicking
// "Send Message" did nothing at all), so this isn't just a UI swap, it's
// the first time this form has ever actually worked.
//
// formId below points at the real "Contact Us" FormDefinitionModel in the
// impactdisciplesdev project's `forms` collection (fields: Name/Email side
// by side, Subject and Message full-width, all four required - matching
// the old dx-form's dataFields and colSpan layout exactly). It's editable
// going forward via impactdisciples-admin's Web Manager > Form Builder,
// same as every other formId in this app.
@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    standalone: false
})
export class ContactComponent {
  /** Editable copy by slot key; every template use falls back to its own. */
  readonly content$: Observable<Record<string, PageContentBlock>>;

  constructor(pageContent: PageContentService) {
    this.content$ = pageContent.blocksFor('contact');
  }

  public impactDisciplesInfo = impactDisciplesInfo;
  readonly formId = 'N0ynW6zeYKdXQS2EkBii';
}
