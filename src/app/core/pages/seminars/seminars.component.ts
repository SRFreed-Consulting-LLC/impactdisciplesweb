import { Component, OnInit } from '@angular/core';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { Observable } from 'rxjs';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PageContentService } from 'src/app/common/services/data/page-content.service';

@Component({
    selector: 'app-seminars',
    templateUrl: './seminars.component.html',
    styleUrls: ['./seminars.component.scss'],
    standalone: false
})
export class SeminarsComponent implements OnInit {
  /** Editable copy by slot key; every template use falls back to its own. */
  readonly content$: Observable<Record<string, PageContentBlock>>;

  isPlaying = false;

  public impactDisciplesInfo = impactDisciplesInfo;

  public webConfig: WebConfigModel = new WebConfigModel();

  // The "START TODAY" consultation-request widget below is now backed by
  // app-dynamic-form (src/app/shared/form-renderer/) - the "Consultation
  // Request" form is authored/edited in the sibling impactdisciples-admin
  // app's Web Manager > Form Builder, not here. See
  // consultation-survey.component.ts for the full explanation of this
  // pattern (same one, fourth use - the only one embedded as a widget on a
  // larger page rather than being its own dedicated page).
  //
  // The id below is this form's Firestore document id in the
  // impactdisciplesdev project - not portable to production as-is, same
  // caveat as every other formId in this app.
  readonly consultationRequestFormId = 'KsdeDkokfLGRI3sPFijp';

  constructor(public utilsService: UtilsService, private webConfigService: WebConfigService, private pageContent: PageContentService) {
    this.content$ = pageContent.blocksFor('seminars');
  }

  async ngOnInit(): Promise<void> {
    this.webConfig = await this.webConfigService.getAll().then(configs => {
      return configs[0];
    });
  }

  playVideo(){
    this.isPlaying = true;
  }
}
