import { Component, OnInit } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { liveSections } from 'src/app/shared/utils/page-sections';

/**
 * Seminars - an ordered stack of sections read from `page_content/seminars`.
 *
 * The page holds no copy and no layout decisions of its own: it loops, and
 * app-seminars-section draws each block according to its type. Staff
 * reorder, switch off and edit sections from Page Manager > Seminars, and
 * this follows with no deploy.
 *
 * NO FALLBACK. The document is the only copy of this page's text (Shane's
 * call, 2026-08-29), so an unreadable read renders an empty page and
 * page_content must exist in an environment before this build ships there.
 *
 * No styleUrls: every rule this page uses is for markup that now lives in
 * the section component, and with emulated encapsulation a stylesheet only
 * reaches the component that renders the element.
 */
@Component({
    selector: 'app-seminars',
    templateUrl: './seminars.component.html',
    standalone: false
})
export class SeminarsComponent implements OnInit {
  /** The ordered sections this page draws. Empty until the read lands. */
  sections$: Observable<PageContentBlock[]> = of([]);

  /** Prices, handed to any section that names one. Never stored in
   *  page_content - a price with two homes drifts. */
  public webConfig: WebConfigModel = new WebConfigModel();

  // The "START TODAY" consultation-request widget is backed by
  // app-dynamic-form (src/app/shared/form-renderer/) - the "Consultation
  // Request" form is authored in the sibling admin app's Form Builder, not
  // here. The id below is this form's Firestore document id in the
  // impactdisciplesdev project - not portable to production as-is, the same
  // caveat as every other formId in this app.
  //
  // It stays HERE rather than in page_content on purpose: an id retyped into
  // a text box is a blank widget nobody can diagnose. The words around the
  // form are editable; which form it is, is not.
  readonly consultationRequestFormId = 'KsdeDkokfLGRI3sPFijp';

  constructor(
    private webConfigService: WebConfigService,
    private pageContent: PageContentService
  ) {
    this.sections$ = this.pageContent.forPage('seminars').pipe(map(liveSections));
  }

  async ngOnInit(): Promise<void> {
    this.webConfig = await this.webConfigService.getAll().then(configs => configs[0]);
  }
}
