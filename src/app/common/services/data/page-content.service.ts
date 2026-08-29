import { Injectable } from '@angular/core';
import { Observable, map, of, shareReplay, startWith, catchError } from 'rxjs';
import { PageContentModel } from '@impact-common/shared/models/domain/page-content.model';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { BaseService } from './base.service';
import { PagePreviewService } from './page-preview.service';

/**
 * The editable content of a public page, by page slug.
 *
 * ONE DOCUMENT PER PAGE, holding an ordered stack of typed sections. Every
 * wired page is a dispatcher: it loops over what this returns and draws each
 * section according to its type.
 *
 * THERE IS NO FALLBACK, and an earlier version of this comment promised the
 * opposite. It said a page short a block "renders exactly what it rendered
 * before any of this existed", because the templates carried a duplicate of
 * every string. That duplicate was removed when the pages were seeded
 * (Shane's call, 2026-08-29) - one copy that can be edited beats two that can
 * silently disagree - so a document that cannot be read now renders an empty
 * page, and page_content must exist in an environment BEFORE the web build
 * that reads it ships there.
 *
 * Nothing here throws even so. A failed read resolves to "no content", which
 * is the same path as "not seeded yet"; a page that renders empty is bad, but
 * an unhandled error in a shared stream takes the site down.
 */
@Injectable({
  providedIn: 'root'
})
export class PageContentService extends BaseService<PageContentModel> {
  /** One stream per page slug, shared - several components on a page (and
   *  the page plus its children) must not each open a listener. */
  private readonly cache = new Map<string, Observable<PageContentModel | null>>();

  constructor(
    public override dao: FirebaseDAO<PageContentModel>,
    // Page Manager's previewer, and NOTHING else, needs the saved content
    // bent on its way out: narrowed to one section, with an unsaved edit
    // swapped in. It composes here rather than in eleven page components
    // because this is the one seam every one of them shares - and it is a
    // no-op on an ordinary visit, which is the only reason a data service is
    // allowed to know about a preview at all. See PagePreviewService.
    private preview: PagePreviewService
  ) {
    super(dao)
    this.table = "page_content"
  }

  /**
   * The page's saved content, or null while it loads / if it cannot be read.
   * Starts with null so a template renders its defaults immediately rather
   * than being blank for a round trip.
   */
  forPage(slug: string): Observable<PageContentModel | null> {
    if (!this.cache.has(slug)) {
      // streamByDocId, not streamByValue: querying by an `id` FIELD emits an
      // empty array before the real snapshot lands, and permanently for a
      // missing doc - see its comment in FirebaseDAO. It already swallows
      // errors into [], which is the same shape as "not seeded yet".
      const saved = this.dao.streamByDocId(slug, this.table, this.fromFirestore).pipe(
        map((rows) => rows[0] ?? null),
        catchError(() => of(null)),
        startWith(null)
      );
      this.cache.set(slug, this.preview.apply(saved).pipe(
        shareReplay({ bufferSize: 1, refCount: false })
      ));
    }
    return this.cache.get(slug)!;
  }
}

// `blocksFor()` and `toBlockMap()` used to live here, returning a key -> block
// map for templates that asked `content['hero']?.heading`. Every page reads
// `type` and the array's ORDER now, so a lookup by key would answer a question
// no page asks - and would quietly keep working while a section it could not
// see went unrendered. Dropped 2026-08-29 with the last fixed-layout page.
// See src/app/shared/utils/page-sections.ts for what replaced them.
