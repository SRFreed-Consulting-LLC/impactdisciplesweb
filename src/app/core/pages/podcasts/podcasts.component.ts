import { ViewportScroller } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PodCastModel } from 'impactdisciplescommon/src/models/domain/pod-cast-model';
import { WebConfigModel } from 'impactdisciplescommon/src/models/utils/web-config.model';
import { PodCastService } from 'impactdisciplescommon/src/services/data/pod-cast.service';
import { WebConfigService } from 'impactdisciplescommon/src/services/data/web-config.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-podcasts',
  templateUrl: './podcasts.component.html',
  styleUrls: ['./podcasts.component.scss']
})
export class PodcastsComponent implements OnInit, OnDestroy {
  podcasts: PodCastModel[] = [];
  filteredPodcasts: PodCastModel[] = [];
  selectedPodcast: PodCastModel;
  isListView: boolean = false;
  public webConfig: WebConfigModel;
  public pageSize: number = 6;
  public paginate: any = {};
  public sortBy: string = 'asc';
  public pageNo: number = 1;

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

  getPager(totalItems: number, currentPage: number = 1, pageSize: number = 9) {
    // calculate total pages
    let totalPages = Math.ceil(totalItems / pageSize);

    // Paginate Range
    let paginateRange = 3;

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
    let startIndex = (currentPage - 1) * pageSize;
    let endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

    // create an array of pages to ng-repeat in the pager control
    let pages = Array.from(Array((endPage + 1) - startPage).keys()).map(i => startPage + i);

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
