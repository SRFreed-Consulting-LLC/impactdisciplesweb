import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PageContentService } from 'src/app/common/services/data/page-content.service';

/**
 * About Us. Its wording and pictures are editable in the admin (Page
 * Manager > About Us); everything below falls back to what the page has
 * always shown, so an unseeded or unreadable document changes nothing.
 */
@Component({
    selector: 'app-about-us',
    templateUrl: './about-us.component.html',
    styleUrls: ['./about-us.component.scss'],
    standalone: false
})
export class AboutUsComponent  {
  readonly content$: Observable<Record<string, PageContentBlock>>;

  isPlaying = false;

  constructor(pageContent: PageContentService) {
    this.content$ = pageContent.blocksFor('about-us');
  }

  playVideo(){
    this.isPlaying = true;
  }
}
