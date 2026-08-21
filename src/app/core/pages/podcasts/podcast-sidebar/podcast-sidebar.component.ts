import { Component, EventEmitter, Input, Output } from '@angular/core';
import { toMillis } from '@impact-common/shared/utils/date-from-timestamp';
import { PodCastModel } from '@impact-common/shared/models/domain/pod-cast.model';

@Component({
    selector: 'app-podcast-sidebar',
    templateUrl: './podcast-sidebar.component.html',
    styleUrls: ['./podcast-sidebar.component.scss'],
    standalone: false
})
export class PodcastSidebarComponent {
  @Output() searchEvent = new EventEmitter<string>();
  @Output() selectPodcast = new EventEmitter<PodCastModel>();
  @Output() clearFiltersEvent = new EventEmitter<void>();

  // The "recent" list is derived from the podcasts the parent already loads
  // and passes in -- the sidebar no longer opens its own duplicate active-
  // podcasts listener on top of the parent's (P7).
  private _podcasts: PodCastModel[] = [];
  @Input() set podcasts(value: PodCastModel[]) {
    this._podcasts = value ?? [];
    this.recentPodcasts = [...this._podcasts]
      .sort((a, b) => toMillis(b?.date) - toMillis(a?.date))
      .slice(0, 5);
  }
  get podcasts(): PodCastModel[] {
    return this._podcasts;
  }

  public recentPodcasts: PodCastModel[] = [];

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
}
