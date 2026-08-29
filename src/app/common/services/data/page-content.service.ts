import { Injectable } from '@angular/core';
import { Observable, map, of, shareReplay, startWith, catchError } from 'rxjs';
import { PageContentBlock, PageContentModel } from '@impact-common/shared/models/domain/page-content.model';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { BaseService } from './base.service';

/**
 * The editable content of a public page, by page slug.
 *
 * THE CONTRACT EVERY PAGE RELIES ON: a page asks for a block by key and gets
 * back either what staff saved or `undefined`, and the template supplies its
 * own default for `undefined`. So a page whose document is missing, empty,
 * unreadable, or simply short a block renders exactly what it rendered
 * before any of this existed. There is no state in which a rules mistake or
 * an unseeded collection blanks a marketing page.
 *
 * That is also why nothing here throws. A failed read resolves to "no
 * content", which is the same path as "not seeded yet".
 */
@Injectable({
  providedIn: 'root'
})
export class PageContentService extends BaseService<PageContentModel> {
  /** One stream per page slug, shared - several components on a page (and
   *  the page plus its children) must not each open a listener. */
  private readonly cache = new Map<string, Observable<PageContentModel | null>>();

  constructor(public override dao: FirebaseDAO<PageContentModel>) {
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
      this.cache.set(slug, this.dao.streamByDocId(slug, this.table, this.fromFirestore).pipe(
        map((rows) => rows[0] ?? null),
        catchError(() => of(null)),
        startWith(null),
        shareReplay({ bufferSize: 1, refCount: false })
      ));
    }
    return this.cache.get(slug)!;
  }

  /**
   * A map of key -> block for one page, which is what a template wants: it
   * asks `content['hero']?.heading` and falls back with `??`.
   */
  blocksFor(slug: string): Observable<Record<string, PageContentBlock>> {
    return this.forPage(slug).pipe(map((doc) => toBlockMap(doc)));
  }
}

/** Switched-off blocks are left out, so `?? default` catches them too. */
export function toBlockMap(doc: PageContentModel | null): Record<string, PageContentBlock> {
  const map: Record<string, PageContentBlock> = {};
  for (const block of doc?.blocks ?? []) {
    if (block?.key && block.isActive !== false) {
      map[block.key] = block;
    }
  }
  return map;
}
