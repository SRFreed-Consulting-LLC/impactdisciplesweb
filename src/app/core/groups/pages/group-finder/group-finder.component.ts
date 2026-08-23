import { Component, DestroyRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { PublicGroupSummary } from '@impact-common/shared/contract/web-http.types';
import { PublicGroupService } from '../../services/public-group.service';
import {
  MeetingFilter,
  StartsFilter,
  buildSearchRequest,
  hasActiveFilters,
} from '../../utils/group-display.util';

interface BookFacet {
  bookId: string;
  bookTitle: string;
  count: number;
}

/**
 * The public Impact Group finder.
 *
 * Reads through the `search_impact_groups` Cloud Function, never Firestore
 * directly - group reads are gated behind `signedIn()` and this site has no
 * auth. Joining and creating hand off to the reader.
 */
@Component({
  selector: 'app-group-finder',
  standalone: false,
  templateUrl: './group-finder.component.html',
  styleUrls: ['./group-finder.component.scss'],
})
export class GroupFinderComponent implements OnInit {
  groups: PublicGroupSummary[] = [];
  bookFacets: BookFacet[] = [];
  total = 0;
  loading = true;
  loadingMore = false;
  errored = false;
  locating = false;
  locationError: string | undefined;

  searchText = '';
  bookId: string | undefined;
  meeting: MeetingFilter = 'all';
  starts: StartsFilter = 'any';
  coords: { lat: number; lng: number } | undefined;
  radiusMi = 25;
  readonly radiusOptions = [10, 25, 50];

  private nextCursor: string | undefined;

  constructor(
    private publicGroups: PublicGroupService,
    private route: ActivatedRoute,
    private router: Router,
    private title: Title,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Find an Impact Group | Impact Disciples Ministries');
    // Deep links like /impact-groups?book=<id> come from the store's
    // "see all groups for this book" link, so the filter has to survive
    // arriving cold rather than only being set by a click.
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.bookId = params.get('book') ?? undefined;
        this.searchText = params.get('q') ?? '';
        void this.runSearch();
      });
  }

  get hasFilters(): boolean {
    return hasActiveFilters({
      q: this.searchText,
      bookId: this.bookId,
      meeting: this.meeting,
      starts: this.starts,
      coords: this.coords,
    });
  }

  get canLoadMore(): boolean {
    return !!this.nextCursor;
  }

  get createUrl(): string {
    return this.publicGroups.createUrl(this.bookId);
  }

  onSearchSubmit(value: string): void {
    this.searchText = value;
    void this.runSearch();
  }

  /** Clearing the box restores the full list without needing a submit. */
  onSearchInputChange(value: string): void {
    if (value === '') {
      this.searchText = '';
      void this.runSearch();
    }
  }

  onMeetingChange(meeting: MeetingFilter): void {
    this.meeting = meeting;
    void this.runSearch();
  }

  onStartsChange(starts: StartsFilter): void {
    this.starts = starts;
    void this.runSearch();
  }

  onBookChange(bookId: string | undefined): void {
    this.bookId = bookId;
    void this.runSearch();
  }

  onRadiusChange(radiusMi: number): void {
    this.radiusMi = radiusMi;
    if (this.coords) void this.runSearch();
  }

  clearFilters(): void {
    this.searchText = '';
    this.bookId = undefined;
    this.meeting = 'all';
    this.starts = 'any';
    this.coords = undefined;
    this.locationError = undefined;
    // Drop the deep-link params too, or a reload would silently reapply the
    // filter the visitor just cleared.
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  useMyLocation(): void {
    if (this.coords) {
      this.coords = undefined;
      void this.runSearch();
      return;
    }
    if (!navigator.geolocation) {
      this.locationError = 'Your browser cannot share your location.';
      return;
    }
    this.locating = true;
    this.locationError = undefined;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.locating = false;
        this.coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        void this.runSearch();
      },
      () => {
        // Denied, unavailable or timed out - all the same to the visitor,
        // and none of them should look like the page is broken.
        this.locating = false;
        this.locationError = 'We could not get your location. Try searching by city instead.';
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  async loadMore(): Promise<void> {
    if (!this.nextCursor || this.loadingMore) return;
    this.loadingMore = true;
    try {
      const result = await this.publicGroups.search(
        buildSearchRequest({
          q: this.searchText,
          bookId: this.bookId,
          meeting: this.meeting,
          starts: this.starts,
          coords: this.coords,
          radiusMi: this.radiusMi,
          cursor: this.nextCursor,
        })
      );
      this.groups = [...this.groups, ...result.groups];
      this.nextCursor = result.nextCursor;
    } catch {
      // Keep what is already on screen; only the "load more" affordance
      // goes away, which is less jarring than emptying the grid.
      this.nextCursor = undefined;
    } finally {
      this.loadingMore = false;
    }
  }

  private async runSearch(): Promise<void> {
    this.loading = true;
    this.errored = false;
    try {
      const result = await this.publicGroups.search(
        buildSearchRequest({
          q: this.searchText,
          bookId: this.bookId,
          meeting: this.meeting,
          starts: this.starts,
          coords: this.coords,
          radiusMi: this.radiusMi,
        })
      );
      this.groups = result.groups;
      this.total = result.total;
      this.nextCursor = result.nextCursor;
      this.rebuildBookFacets();
    } catch {
      this.errored = true;
      this.groups = [];
      this.total = 0;
      this.nextCursor = undefined;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Book counts for the sidebar. Built from the current page only, and
   * deliberately NOT rebuilt while a book filter is active - otherwise
   * picking a book would collapse the list to that one book and strand the
   * visitor with no way back to the others.
   */
  private rebuildBookFacets(): void {
    if (this.bookId) return;
    const counts = new Map<string, BookFacet>();
    for (const group of this.groups) {
      if (!group.bookId || !group.bookTitle) continue;
      const existing = counts.get(group.bookId);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(group.bookId, {
          bookId: group.bookId,
          bookTitle: group.bookTitle,
          count: 1,
        });
      }
    }
    this.bookFacets = [...counts.values()].sort((a, b) => b.count - a.count);
  }
}
