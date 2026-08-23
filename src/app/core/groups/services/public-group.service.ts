import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CloudFunctionsClient } from 'src/app/common/services/data/cloud-functions.client';
import {
  PublicGroupSummary,
  SearchImpactGroupsRequest,
  SearchImpactGroupsResult,
} from '@impact-common/shared/contract/web-http.types';

/**
 * The public site's only way to see Impact Groups.
 *
 * Deliberately NOT a FirebaseDAO/BaseService like every other data service
 * here: `firestore.rules` gates every `discussionGroups` read behind
 * `signedIn()`, and this app has no Firebase Auth at all, so a Firestore
 * query would fail for every visitor. The `search_impact_groups` Cloud
 * Function reads with the Admin SDK and returns a sanitised projection
 * instead - see its header comment in the admin repo for what it withholds.
 */
@Injectable({ providedIn: 'root' })
export class PublicGroupService {
  constructor(private cloudFunctions: CloudFunctionsClient) {}

  async search(request: SearchImpactGroupsRequest = {}): Promise<SearchImpactGroupsResult> {
    const params = new URLSearchParams();
    // Only send what was actually asked for - an empty param would be
    // parsed as a real (empty) filter by the function, and it would also
    // fragment the CDN cache key for no benefit.
    if (request.q) params.set('q', request.q);
    if (request.bookId) params.set('bookId', request.bookId);
    if (request.meeting) params.set('meeting', request.meeting);
    // Coordinates only count as a pair; one alone is meaningless.
    if (request.lat !== undefined && request.lng !== undefined) {
      params.set('lat', String(request.lat));
      params.set('lng', String(request.lng));
      if (request.radiusMi !== undefined) params.set('radiusMi', String(request.radiusMi));
    }
    if (request.startsWithin !== undefined) {
      params.set('startsWithin', String(request.startsWithin));
    }
    if (request.limit !== undefined) params.set('limit', String(request.limit));
    if (request.cursor) params.set('cursor', request.cursor);

    const query = params.toString();
    const url = query
      ? `${environment.searchImpactGroupsUrl}?${query}`
      : environment.searchImpactGroupsUrl;

    return this.cloudFunctions.get<SearchImpactGroupsResult>(url, {
      fallbackError: 'We could not load Impact Groups right now. Please try again.',
    });
  }

  /**
   * One group by id. The function has no by-id endpoint - a group page is
   * rare enough traffic that adding one is not worth a second deploy
   * surface, and this reuses the same cached projection.
   */
  async getById(groupId: string): Promise<PublicGroupSummary | undefined> {
    // The finder's own page size is the cap; a group beyond it would not be
    // browsable either, so paging further here would be inconsistent.
    const result = await this.search({ limit: 60 });
    const match = result.groups.find((g) => g.id === groupId);
    if (match || !result.nextCursor) {
      return match;
    }
    let cursor: string | undefined = result.nextCursor;
    while (cursor) {
      const page: SearchImpactGroupsResult = await this.search({ limit: 60, cursor });
      const found = page.groups.find((g) => g.id === groupId);
      if (found) return found;
      cursor = page.nextCursor;
    }
    return undefined;
  }

  /**
   * The reader deep-link for anything that needs an account. Joining and
   * creating both live in the reader; this site only ever discovers.
   */
  joinUrl(groupId: string): string {
    return `${environment.readerAppOrigin}/groups/${encodeURIComponent(groupId)}?from=web`;
  }

  createUrl(bookId?: string): string {
    const base = `${environment.readerAppOrigin}/groups?create=1`;
    return bookId ? `${base}&bookId=${encodeURIComponent(bookId)}` : base;
  }
}
