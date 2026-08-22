import { ViewportScroller } from '@angular/common';
import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PodCastModel } from '@impact-common/shared/models/domain/pod-cast.model';
import { Pager } from 'src/app/common/models/utils/pager.model';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { YoutubePodcastService } from './youtube-podcast.service';

// The /podcasts page. Episodes come from the YouTube playlist itself,
// via get_youtube_podcasts_public.
//
// This replaced the original Firestore-backed PodcastsComponent on
// 2026-08-21, after running beside it at /podcasts-v2 first. The old
// component read the `pod_casts` collection, which the admin app's Pod
// Casts screen maintained by hand; both that screen and that reading path
// are gone now, so YouTube is the single source of truth for what is an
// episode. The collection's documents still exist but nothing reads them.
//
// Consequences of that, all intended: there is no isActive filter (the
// playlist is the filter), no category, and titles/tags are YouTube's.
// The whole feed arrives in one call and is already sorted newest-first
// server side, so there is no per-page query and no need for the original's
// 60-episode cap - pagination is pure slicing over an in-memory array, and
// so is search.
@Component({
  selector: 'app-podcasts',
  templateUrl: './podcasts.component.html',
  styleUrls: ['./podcasts.component.scss'],
  standalone: false
})
export class PodcastsComponent implements OnInit {
  private readonly podcastService = inject(YoutubePodcastService);
  private readonly webConfigService = inject(WebConfigService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly viewScroller = inject(ViewportScroller);
  private readonly destroyRef = inject(DestroyRef);

  podcasts: PodCastModel[] = [];
  filteredPodcasts: PodCastModel[] = [];
  selectedPodcast: PodCastModel;
  isListView = false;
  isPlaying = false;
  public webConfig: WebConfigModel;
  public pageSize = 6;
  public paginate: Pager = {};
  public pageNo = 1;

  // Unlike the original, which streams Firestore and paints almost
  // immediately, this page waits on a Cloud Function - a cold start is a
  // couple of seconds of nothing. Hence an explicit loading state.
  public loading = true;
  public loadError = '';

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.pageNo = params['page'] ? params['page'] : this.pageNo;
      this.applyPage();
    });

    this.podcastService.getPodcasts()
      .then((podcasts) => {
        this.podcasts = podcasts;
        this.selectedPodcast = this.podcasts[0];
        this.applyPage();
      })
      .catch((err) => {
        this.loadError = err?.message || 'Failed to load podcasts from YouTube';
      })
      .finally(() => {
        this.loading = false;
      });

    this.webConfigService.getAll().then(configs => {
      this.webConfig = configs[0];
    });
  }

  playVideo(){
    this.isPlaying = true;
  }

  private applyPage(): void {
    this.paginate = this.getPager(this.podcasts.length, Number(+this.pageNo), this.pageSize);
    this.filteredPodcasts = this.podcasts.slice(this.paginate.startIndex, this.paginate.endIndex + 1);
  }

  selectPodcast(podcast: PodCastModel) {
    this.selectedPodcast = podcast;
    this.isListView = false;
  }

  // Runs entirely against the already-loaded array - no request per
  // keystroke, and nothing is sent to YouTube. (YouTube's own search.list
  // costs 100 quota units a query against a 10,000/day budget, versus 1
  // for this whole feed, and it cannot be scoped to a single playlist.)
  // Matches title, tags and description; description is what usually
  // carries guest names and topics.
  searchPodcasts(searchTerm: string): void {
    this.selectedPodcast = null;
    const termLower = searchTerm.toLowerCase();
    this.filteredPodcasts = this.podcasts.filter(
      (podcast) =>
        podcast.title?.toLowerCase().includes(termLower) ||
        podcast.description?.toLowerCase().includes(termLower) ||
        podcast.tags?.some((tag) => tag.tag.toLowerCase().includes(termLower)) ||
        podcast.date.toString().includes(termLower)
    );
    this.paginate = this.getPager(this.filteredPodcasts.length, Number(+this.pageNo), this.pageSize);
    this.isListView = true;
  }

  clearFilters(): void {
    this.applyPage();
    this.selectedPodcast = null;
    this.isListView = true;
  }

  setPage(page: number) {
    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: { page: page },
        queryParamsHandling: 'merge',
        skipLocationChange: false,
      })
      .finally(() => {
        this.viewScroller.setOffset([120, 120]);
      });
  }

  getPager(totalItems: number, currentPage = 1, pageSize = 9) {
    // calculate total pages
    const totalPages = Math.ceil(totalItems / pageSize);

    // Paginate Range
    const paginateRange = 3;

    // ensure current page isn't out of range
    if (currentPage < 1) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    let startPage: number, endPage: number;
    if (totalPages <= 5) {
      startPage = 1;
      endPage = totalPages;
    } else if(currentPage < paginateRange - 1){
      startPage = 1;
      endPage = startPage + paginateRange - 1;
    } else {
      startPage = currentPage - 1;
      endPage =  currentPage + 1;
    }

    // calculate start and end item indexes
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

    // create an array of pages to ng-repeat in the pager control
    const pages = Array.from(Array((endPage + 1) - startPage).keys()).map(i => startPage + i);

    // return object with all pager properties required by the view
    return {
      totalItems: totalItems,
      currentPage: currentPage,
      pageSize: pageSize,
      totalPages: totalPages,
      startPage: startPage,
      endPage: endPage,
      startIndex: startIndex,
      endIndex: endIndex,
      pages: pages
    };
  }
}
