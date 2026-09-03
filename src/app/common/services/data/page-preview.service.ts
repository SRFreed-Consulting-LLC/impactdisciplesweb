import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { PageContentBlock, PageContentModel } from '@impact-common/shared/models/domain/page-content.model';
import { HomeSectionModel } from '@impact-common/shared/models/domain/home-section.model';
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

  /**
   * The section being edited, as it currently stands.
   *
   * Typed loosely because it carries either shape: the other eleven pages
   * store a PageContentBlock keyed by `key`, and the home page stores a
   * HomeSectionModel keyed by `id`. Everything here works off whichever one
   * a section has - see identify().
   */
  private readonly override$ = new BehaviorSubject<PreviewSection | null>(null);

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
      let latestOverride: PreviewSection | null = null;
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

  /**
   * The same two rules for the HOME page, whose sections are a collection of
   * their own rather than blocks inside one document.
   *
   * A separate method rather than a shape-shifting one: the two really are
   * different collections with different models, and pretending otherwise
   * would mean casting at both call sites instead of here.
   */
  applyHomeSections(sections$: Observable<HomeSectionModel[]>): Observable<HomeSectionModel[]> {
    if (!isAdminPreview()) {
      return sections$;
    }
    return this.apply(
      sections$.pipe(map((sections) => ({ blocks: sections } as unknown as PageContentModel)))
    ).pipe(map((doc) => ((doc?.blocks ?? []) as unknown as HomeSectionModel[])));
  }

  private transform(
    doc: PageContentModel | null,
    override: PreviewSection | null
  ): PageContentModel | null {
    if (!doc) {
      // An unsaved section still has to draw before its page has loaded -
      // otherwise a brand new section previews as nothing.
      return override && this.sectionKey === identify(override)
        ? ({ blocks: [override] } as unknown as PageContentModel)
        : doc;
    }

    let blocks = (doc.blocks ?? []) as PreviewSection[];
    if (override) {
      const id = identify(override);
      blocks = blocks.map((b) => (identify(b) === id ? override : b));
      // A section added but not yet saved is not in the document at all.
      if (!blocks.some((b) => identify(b) === id)) {
        blocks = [...blocks, override];
      }
    }
    if (this.sectionKey) {
      // Switched off is IGNORED for the one section being edited: staff are
      // looking at it precisely because they are working on it, and a blank
      // rail would read as a broken preview.
      blocks = blocks
        .filter((b) => identify(b) === this.sectionKey)
        .map((b) => ({ ...b, isActive: true }));
    }
    return { ...doc, blocks } as unknown as PageContentModel;
  }

  private onMessage(event: MessageEvent): void {
    if (!ADMIN_ORIGINS.includes(event.origin)) {
      return;
    }
    const data = event.data as {
      impactPreviewSection?: unknown;
      impactPreviewHighlight?: unknown;
    } | null;

    // "Where is section X?" - the admin outlines the row being hovered over
    // the framed page, and the frame is the only thing that can measure it.
    if (data && 'impactPreviewHighlight' in data) {
      this.answerHighlight(data.impactPreviewHighlight, event);
      return;
    }

    const block = data?.impactPreviewSection;
    if (!isBlock(block)) {
      return;
    }
    // Back inside Angular: a raw message listener is outside the zone in
    // some bootstraps, and a preview that only redrew on the next unrelated
    // event would look broken rather than late.
    this.zone.run(() => this.override$.next(block));
  }

  /**
   * Replies with the hovered section's rectangle, in this page's own pixels.
   *
   * NOTHING IS DRAWN HERE. The admin draws the outline over its scaled frame
   * in its own CSS, because an outline drawn on a page shown at 29% is a
   * hairline, and because a highlight only the admin ever wants does not
   * belong in the public stylesheet. This side's whole job is to measure.
   *
   * The rectangle is document-relative. Inside the previewer the frame is
   * sized to the page's full height, so the viewport IS the document and
   * scrollY is 0 - but added anyway, so the answer stays right if that ever
   * changes. A key that names no section on the page answers null, and so
   * does a cleared hover, so the admin can take its outline down.
   */
  private answerHighlight(key: unknown, event: MessageEvent): void {
    const source = event.source as Window | null;
    if (!source || typeof source.postMessage !== 'function') {
      return;
    }
    const rect = typeof key === 'string' && key ? findSectionRect(key) : null;
    source.postMessage({ impactPreviewHighlightRect: rect }, event.origin);
  }
}

/** Where one section sits on this page, or null when it is not on it. */
export interface SectionRect {
  key: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Finds the rendered section carrying `data-section-key`, by comparing the
 * attribute rather than building a selector out of the key - a key is a
 * document field, and a selector built from one is a selector somebody else
 * wrote.
 */
export function findSectionRect(key: string, root: ParentNode = document): SectionRect | null {
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-section-key]'));
  const el = sections.find((s) => s.dataset['sectionKey'] === key);
  if (!el) {
    return null;
  }
  const r = el.getBoundingClientRect();
  const scrollX = typeof window === 'undefined' ? 0 : window.scrollX;
  const scrollY = typeof window === 'undefined' ? 0 : window.scrollY;
  return {
    key,
    top: Math.round(r.top + scrollY),
    left: Math.round(r.left + scrollX),
    width: Math.round(r.width),
    height: Math.round(r.height)
  };
}

/**
 * Either shape of section: a page's block, keyed by `key`, or a home-page
 * section, keyed by `id`. Deliberately loose - this file only ever reads the
 * identifier and hands the rest through untouched.
 */
type PreviewSection = (PageContentBlock | HomeSectionModel) & {
  key?: string;
  id?: string;
  isActive?: boolean;
};

/** Whichever identifier this kind of section carries. */
function identify(section: PreviewSection): string {
  return section.key ?? section.id ?? '';
}

/** A shape check, not a schema: everything on a section is optional except
 *  its identifier, and a message that cannot name one cannot replace one. */
function isBlock(value: unknown): value is PreviewSection {
  return !!value
    && typeof value === 'object'
    && !!identify(value as PreviewSection);
}
