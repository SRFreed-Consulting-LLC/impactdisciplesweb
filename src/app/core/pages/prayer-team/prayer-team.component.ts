import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PageContentService } from 'src/app/common/services/data/page-content.service';
import { liveSections } from 'src/app/shared/utils/page-sections';

/**
 * Prayer Team - an ordered stack of sections read from
 * `page_content/prayer-team`.
 *
 * The join form and its submit moved into app-prayer-section with the markup
 * that draws them: this page is a loop and owns nothing.
 *
 * NO FALLBACK - see seminars.component.ts. The stylesheet stays because the
 * `.prayer-team__container` wrapper is in THIS template.
 */
@Component({
    selector: 'app-prayer-team',
    templateUrl: './prayer-team.component.html',
    styleUrls: ['./prayer-team.component.scss'],
    standalone: false
})
export class PrayerTeamComponent {
  /** The ordered sections this page draws. Empty until the read lands. */
  readonly sections$: Observable<PageContentBlock[]>;

  constructor(pageContent: PageContentService) {
    this.sections$ = pageContent.forPage('prayer-team').pipe(map(liveSections));
  }
}
