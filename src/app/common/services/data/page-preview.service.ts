import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PageContentBlock, PageContentModel } from '@impact-common/shared/models/domain/page-content.model';
import { APP_URLS, LOCAL_APP_URLS } from '@impact-common/shared/config/firebase-projects';
import { isAdminPreview, previewSectionKey } from 'src/app/shared/utils/admin-preview';

/**
 * Every origin the ADMIN is ever served from. A message claiming to carry a
 * section is only listened to from one of these.
 *
 * Built from the shared config rather than typed out, so the port rule and
 * the hosting targets have one home - see APP_URLS.
 */
const ADMIN_ORIGINS: readonly string[] = [
  APP_URLS.admin.dev,
  APP_URLS.admin.prod,
  APP_URLS.admin.emulator,
  LOCAL_APP_URLS.admin
].map((url) => {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
});

/**
 * Turns a page's saved content into what Page Manager's previewer should
 * show, when the site is being previewed. On an ordinary visit it does
 * nothing at all and every page renders exactly what it always did.
 *
 * TWO THINGS IT DOES, and both are only reachable from the admin:
 *
 *   1. NARROWS TO ONE SECTION. `?section=<key>` renders that block and
 *      nothing else, because the editor's rail previews the section being
 *      worked on rather than the whole page.
 *   2. SUBSTITUTES AN UNSAVED ONE. The editor posts its working copy as
 *      staff type, and this swaps it in, so the preview shows the edit
 *      before it is committed.
 *
 * WHY THE SITE ACCEPTS CONTENT AT ALL, since that is the part worth being
 * uneasy about. Three things bound it:
 *
 *   - it is INERT unless `?adminPreview` is in the URL, so an ordinary
 *     visitor's page never listens;
 *   - the sender's ORIGIN must be one the admin is served from;
 *   - what arrives is rendered through the same `[innerHTML]` the saved copy
 *     goes through, which Angular sanitises, and it is never written
 *     anywhere - it lives in this tab and dies with it.
 *
 * So the worst a hostile sender achieves, having already framed the site with
 * the right parameter, is changing what THEY see in THEIR own browser.
 */
@Injectable({ providedIn: 'root' })
export class PagePreviewService {
  /** Which section to narrow to, or null for the whole page. Fixed for the
   *  life of the page - the frame reloads when it changes. */
  readonly sectionKey: string | null = previewSectionKey();

  private readonly override$ = new BehaviorSubject<PageContentBlock | null>(null);

  constructor(private zone: NgZone) {
    if (!isAdminPreview()) {
      return;
    }
    window.addEventListener('message', (event) => this.onMessage(event));

    if (this.sectionKey) {
      // Hides the site furniture around a single section - see styles.scss.
      // A class rather than eleven template changes.
      document.body.classList.add('impact-preview-section');
    }
  }

  /** True when anything on this page should behave as a preview rather than
   *  a visit - used to hide the site furniture around a single section. */
  get isPreviewingOneSection(): boolean {
    return !!this.sectionKey;
  }

  /**
   * The doc a page should render: narrowed, and with any unsaved edit swapped
   * in. Returns its argument untouched on an ordinary visit.
   */
  apply(doc$: Observable<PageContentModel | null>): Observable<PageContentModel | null> {
    if (!isAdminPreview()) {
      return doc$;
    }
    return new Observable<PageContentModel | null>((subscriber) => {
      let latestDoc: PageContentModel | null = null;
      let latestOverride: PageContentBlock | null = null;
      const emit = () => subscriber.next(this.transform(latestDoc, latestOverride));

      const docSub = doc$.subscribe({
        next: (doc) => { latestDoc = doc; emit(); },
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete()
      });
      const overrideSub = this.override$.subscribe((block) => {
        latestOverride = block;
        emit();
      });

      return () => { docSub.unsubscribe(); overrideSub.unsubscribe(); };
    });
  }

  private transform(
    doc: PageContentModel | null,
    override: PageContentBlock | null
  ): PageContentModel | null {
    if (!doc) {
      // An unsaved section still has to draw before its page has loaded -
      // otherwise a brand new section previews as nothing.
      return override && this.sectionKey === override.key
        ? ({ blocks: [override] } as PageContentModel)
        : doc;
    }

    let blocks = doc.blocks ?? [];
    if (override) {
      blocks = blocks.map((b) => (b.key === override.key ? override : b));
      // A section added but not yet saved is not in the document at all.
      if (!blocks.some((b) => b.key === override.key)) {
        blocks = [...blocks, override];
      }
    }
    if (this.sectionKey) {
      // Switched off is IGNORED for the one section being edited: staff are
      // looking at it precisely because they are working on it, and a blank
      // rail would read as a broken preview.
      blocks = blocks
        .filter((b) => b.key === this.sectionKey)
        .map((b) => ({ ...b, isActive: true }));
    }
    return { ...doc, blocks } as PageContentModel;
  }

  private onMessage(event: MessageEvent): void {
    if (!ADMIN_ORIGINS.includes(event.origin)) {
      return;
    }
    const block = (event.data as { impactPreviewSection?: unknown })?.impactPreviewSection;
    if (!isBlock(block)) {
      return;
    }
    // Back inside Angular: a raw message listener is outside the zone in
    // some bootstraps, and a preview that only redrew on the next unrelated
    // event would look broken rather than late.
    this.zone.run(() => this.override$.next(block));
  }
}

/** A shape check, not a schema: everything on a block is optional except a
 *  key, and a message that cannot name a section cannot replace one. */
function isBlock(value: unknown): value is PageContentBlock {
  return !!value
    && typeof value === 'object'
    && typeof (value as PageContentBlock).key === 'string'
    && !!(value as PageContentBlock).key;
}
