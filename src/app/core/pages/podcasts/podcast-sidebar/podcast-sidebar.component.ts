import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { PodCastModel } from 'impactdisciplescommon/src/models/domain/pod-cast-model';
import { PodCastService } from 'impactdisciplescommon/src/services/data/pod-cast.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-podcast-sidebar',
  templateUrl: './podcast-sidebar.component.html',
  styleUrls: ['./podcast-sidebar.component.scss']
})
export class PodcastSidebarComponent implements OnInit, OnDestroy {
  @Output() searchEvent = new EventEmitter<string>();
  @Output() selectPodcast = new EventEmitter<PodCastModel>();
  @Output() clearFiltersEvent = new EventEmitter<void>();
  @Input() podcasts: PodCastModel[] = [];
  public recentPodcasts: PodCastModel[] = [];

  private ngUnsubscribe = new Subject<void>();

  constructor(private podcastService: PodCastService) {}

  ngOnInit(): void {
    this.podcastService.streamAllByValue('isActive', true).pipe(takeUntil(this.ngUnsubscribe)).subscribe((podcasts) => {
      const sortedPodcasts = podcasts.sort((a, b) => new Date(b?.date?.toString()).getTime() - new Date(a?.date?.toString()).getTime());
      this.recentPodcasts = sortedPodcasts.slice(0, 5);
    });
  }

  onSelectPodcast(podcast: PodCastModel) {
    this.selectPodcast.emit(podcast);
  }

  onSearch(searchTerm: string): void {
    this.searchEvent.emit(searchTerm);
  }

  onSearchInputChange(value: string): void {
    if (value === '') {
      this.onClearFilters();  // Call clearFilter when input is cleared
    }
  }

  onClearFilters(): void {
    this.clearFiltersEvent.emit();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
