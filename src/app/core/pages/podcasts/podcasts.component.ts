import { ViewportScroller } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PodCastModel } from 'src/app/common/models/domain/pod-cast.model';
import { Pager } from 'src/app/common/models/utils/pager.model';
import { WebConfigModel } from 'src/app/common/models/utils/web-config.model';
import { PodCastService } from 'src/app/common/services/data/pod-cast.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-podcasts',
    templateUrl: './podcasts.component.html',
    styleUrls: ['./podcasts.component.scss'],
    standalone: false
})
export class PodcastsComponent implements OnInit, OnDestroy {
  podcasts: PodCastModel[] = [];
  filteredPodcasts: PodCastModel[] = [];
  selectedPodcast: PodCastModel;
  isListView = false;
  isPlaying = false;
  public webConfig: WebConfigModel;
  public pageSize = 6;
  public paginate: Pager = {};
  public sortBy = 'asc';
  public pageNo = 1;

  private ngUnsubscribe = new Subject<void>();

  constructor(public podcastService: PodCastService,
    private webConfigService: WebConfigService,
    private route: ActivatedRoute,
    private router: Router,
    private viewScroller: ViewportScroller) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.pageNo = params['page'] ? params['page'] : this.pageNo;
      this.loadPodcasts();
    });
    this.webConfigService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe(configs => {
     this.webConfig = configs[0];
    });
  }

  playVideo(){
    this.isPlaying = true;
  }

  loadPodcasts(): void {
    this.podcastService.streamAllByValue('isActive', true).pipe(takeUntil(this.ngUnsubscribe)).subscribe((podcasts) => {
      this.podcasts = podcasts.sort((a, b) => new Date(b?.date?.toString()).getTime() - new Date(a?.date?.toString()).getTime());
      this.selectedPodcast = this.podcasts[0];
      this.paginate = this.getPager(this.podcasts.length, Number(+this.pageNo), this.pageSize);
      this.filteredPodcasts = this.podcasts.slice(this.paginate.startIndex, this.paginate.endIndex + 1);
    });
  }

  selectPodcast(podcast: PodCastModel) {
    this.selectedPodcast = podcast;
    this.isListView = false;
  }

  searchPodcasts(searchTerm: string): void {
    this.selectedPodcast = null;
    const termLower = searchTerm.toLowerCase();
    this.filteredPodcasts = this.podcasts.filter(
      (podcast) =>
        podcast.tags?.some((tag) => tag.tag.toLowerCase().includes(termLower)) ||
        podcast.date.toString().includes(termLower) ||
        podcast.title.toLocaleLowerCase().includes(termLower)
    );
    this.paginate = this.getPager(this.filteredPodcasts.length, Number(+this.pageNo), this.pageSize);
    this.isListView = true;
  }

  clearFilters(): void {
    this.loadPodcasts();
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

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
