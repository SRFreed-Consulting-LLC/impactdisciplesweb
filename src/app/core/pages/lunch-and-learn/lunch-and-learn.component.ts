import { Component } from '@angular/core';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';
import { Observable } from 'rxjs';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PageContentService } from 'src/app/common/services/data/page-content.service';

@Component({
    selector: 'app-lunch-and-learn',
    templateUrl: './lunch-and-learn.component.html',
    styleUrls: ['./lunch-and-learn.component.scss'],
    standalone: false
})
export class LunchAndLearnComponent  {
  /** Editable copy by slot key; every template use falls back to its own. */
  readonly content$: Observable<Record<string, PageContentBlock>>;

  isPlaying = false;

  constructor(public utilsService: UtilsService, private pageContent: PageContentService) {
    this.content$ = pageContent.blocksFor('lunch-and-learns');
  }

  playVideo(){
    this.isPlaying = true;
  }
}