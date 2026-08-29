import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { CoachingPageModel } from '@impact-common/shared/models/domain/coaching-page.model';

/** The one document the Coaching with Impact page's content lives in. Keep in
 *  step with the admin repo's own CoachingPageService, which is the only
 *  thing that writes it. */
const COACHING_PAGE_PATH = ['coaching_page', 'current'] as const;

/**
 * Reads the editable content of the Coaching with Impact page, written by the
 * admin app's Page Manager > Coaching with Impact screen. PUBLIC-readable
 * under firestore.rules, because this site has no Firebase Auth at all.
 *
 * Same shape and the same reasoning as DockBarService: one memoized one-shot
 * read, never a live listener, and it never throws - a missing document, a
 * rules rejection or an offline device all resolve `undefined`. The page then
 * renders the content it shipped with, which is what keeps it from going
 * blank if this document has not been written yet.
 */
@Injectable({ providedIn: 'root' })
export class CoachingPageService {
  private cached: Promise<CoachingPageModel | undefined> | null = null;

  constructor(private firestore: Firestore) {}

  /** Memoized for the session so navigating away and back does not re-read
   *  the same document. */
  get(): Promise<CoachingPageModel | undefined> {
    if (!this.cached) {
      this.cached = this.fetch();
    }
    return this.cached;
  }

  private async fetch(): Promise<CoachingPageModel | undefined> {
    try {
      const snap = await getDoc(doc(this.firestore, ...COACHING_PAGE_PATH));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as CoachingPageModel) : undefined;
    } catch {
      return undefined;
    }
  }
}
