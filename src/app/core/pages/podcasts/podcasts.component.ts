import { Component, OnInit } from '@angular/core';
import { PodCastModel } from 'impactdisciplescommon/src/models/domain/pod-cast-model';
import { PodCastService } from 'impactdisciplescommon/src/services/pod-cast.service';
import { Subject, takeUntil } from 'rxjs';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';

@Component({
  selector: 'app-podcasts',
  templateUrl: './podcasts.component.html',
  styleUrls: ['./podcasts.component.scss']
})
export class PodcastsComponent implements OnInit {
  public impactDisciplesInfo = impactDisciplesInfo;
  currentIndex: number = 0;
  visibleSlides: number = 4;
  podcasts: PodCastModel[] = [];
  selectedPodcast: PodCastModel;

  private ngUnsubscribe = new Subject<void>();

  constructor(public podcastService: PodCastService) { }

  ngOnInit(): void {
    this.podcastService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((podcasts) => {
      const sortedPodcasts = podcasts.sort((a, b) => new Date(b?.date?.toString()).getTime() - new Date(a?.date?.toString()).getTime());
      this.selectedPodcast = sortedPodcasts[0];
      this.podcasts = sortedPodcasts.filter(podcast => podcast !== this.selectedPodcast);
    });
  }

  selectPodcast(podcast: PodCastModel) {
    if (this.selectedPodcast) {
      this.podcasts.push(this.selectedPodcast);
    }
   this.selectedPodcast = podcast;

   this.podcasts = this.podcasts.filter(p => p !== podcast);
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex > 0) ? this.currentIndex - 1 : this.podcasts.length - this.visibleSlides;
  }

  nextSlide() {
    const maxIndex = this.podcasts.length - this.visibleSlides;
    this.currentIndex = (this.currentIndex < maxIndex) ? this.currentIndex + 1 : 0;
  }

  getTransform() {
    return `translateX(-${this.currentIndex * (100 / this.visibleSlides)}%)`;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
