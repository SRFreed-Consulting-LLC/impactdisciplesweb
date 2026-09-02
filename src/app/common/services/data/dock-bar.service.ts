import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { DockBarModel } from '@impact-common/shared/models/domain/dock-bar.model';
import { tenantPath } from '@impact-common/shared/lists/tenancy';

/** The one document the docking bar lives in. Keep in step with the admin
 *  repo's own DockBarService, which is the only thing that writes it.
 *
 *  THROUGH tenantPath() like everything else. This service reads Firestore
 *  directly rather than through FirebaseDAO - it is the only one on the
 *  public site that does - so it is also the only place the seam has to be
 *  applied by hand. Miss it and the docking bar is the one thing on the site
 *  still reading the old location, which would keep working right up until
 *  the old collection is deleted. */
const dockBarPath = (): string => `${tenantPath('dock_bar')}/current`;

/**
 * Reads the docking bar's content, written by the admin app's Content
 * Manager > Docking Bar screen. PUBLIC-readable under firestore.rules,
 * because this site has no Firebase Auth at all.
 *
 * A single one-shot read, not a live listener: the bar is site furniture that
 * changes when a staff member edits it, which is rare, and a standing
 * onSnapshot on every page load for every visitor buys nothing. A visitor
 * picks up an edit on their next page load.
 *
 * Never throws. A missing document, a rules rejection or an offline device
 * all resolve `undefined`, which the dock treats as "no bar" - an
 * announcement strip is not worth breaking a page over.
 */
@Injectable({ providedIn: 'root' })
export class DockBarService {
  private cached: Promise<DockBarModel | undefined> | null = null;

  constructor(private firestore: Firestore) {}

  /** Memoized for the session so navigating between pages doesn't re-read
   *  the same document on every route change. */
  get(): Promise<DockBarModel | undefined> {
    if (!this.cached) {
      this.cached = this.fetch();
    }
    return this.cached;
  }

  private async fetch(): Promise<DockBarModel | undefined> {
    try {
      const snap = await getDoc(doc(this.firestore, dockBarPath()));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as DockBarModel) : undefined;
    } catch {
      return undefined;
    }
  }
}
