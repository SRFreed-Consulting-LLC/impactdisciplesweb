import { Component, OnInit } from '@angular/core';
import { Observable, catchError, map, of, startWith } from 'rxjs';
import { HomeSectionModel } from '@impact-common/shared/models/domain/home-section.model';
import { HomeSectionService } from 'src/app/common/services/data/home-sections.service';
import { PagePreviewService } from 'src/app/common/services/data/page-preview.service';
import { DEFAULT_HOME_SECTIONS } from 'src/app/shared/utils/data/home-section-defaults';

/**
 * The public home page: whatever sections `home_sections` says, in the order
 * it says, live.
 *
 * It used to be a fixed stack of components written into the template, with
 * their copy, images and links baked in. Staff now reorder sections, switch
 * one off and edit what is inside each from the admin's Home screen, with no
 * deploy.
 *
 * IT FALLS BACK TO CODE. If the collection is empty or unreadable the page
 * renders DEFAULT_HOME_SECTIONS - the same six sections it always had.
 * This is the front page of the site, and a rules mistake or an empty
 * collection should not blank it. It is the failure the Coaching with
 * Impact screen actually hit on 2026-08-29, from the other side: a missing
 * collection fell through to deny and took the screen down with it.
 *
 * The trade is that a genuinely-empty stack is indistinguishable from a
 * broken read, so "delete every section" shows the defaults rather than an
 * empty page. Switching sections OFF is the supported way to empty it, and
 * that renders empty correctly.
 */
@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    standalone: false
})
export class HomeComponent implements OnInit {
  sections$!: Observable<HomeSectionModel[]>;

  constructor(
    private homeSections: HomeSectionService,
    // Page Manager's previewer, and nothing else: it narrows this page to the
    // one section being edited and swaps in the unsaved copy as staff type.
    // A no-op on an ordinary visit. See PagePreviewService.
    private preview: PagePreviewService
  ) {}

  ngOnInit(): void {
    // The preview transform runs BEFORE the visibility filter on purpose: it
    // forces the one section being edited back on, and a filter ahead of it
    // would already have dropped a switched-off one - leaving staff editing a
    // section against a blank rail.
    this.sections$ = this.preview.applyHomeSections(
      this.homeSections.streamAll()
    ).pipe(
      map((sections) => this.visible(sections)),
      // streamAll() already swallows Firestore errors and emits [] rather
      // than leaving the observable stuck, so an empty result is the shape a
      // failure arrives in - which is exactly why empty means "fall back".
      catchError(() => of(DEFAULT_HOME_SECTIONS)),
      // Render the page immediately rather than after the first snapshot.
      // Without this the whole page is blank for the round trip, which on a
      // marketing front page reads as a broken site.
      startWith(DEFAULT_HOME_SECTIONS)
    );
  }

  private visible(sections: HomeSectionModel[]): HomeSectionModel[] {
    if (!sections?.length) {
      return DEFAULT_HOME_SECTIONS;
    }
    return sections
      .filter((section) => section.isActive)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
}
