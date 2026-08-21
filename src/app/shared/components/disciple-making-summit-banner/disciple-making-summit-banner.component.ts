import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { toMillis } from '@impact-common/shared/utils/date-from-timestamp';
import { EventModel } from '@impact-common/shared/models/domain/event.model';
import { EventService } from 'src/app/common/services/data/event.service';

@Component({
    selector: 'app-disciple-making-summit-banner',
    templateUrl: './disciple-making-summit-banner.component.html',
    styleUrls: ['./disciple-making-summit-banner.component.scss'],
    standalone: false
})
export class DiscipleMakingSummitBannerComponent implements OnInit, OnDestroy {
  @Input() large = false;

  public dms: EventModel;
  public days = 0;
  public hours = 0;
  public minutes = 0;
  public seconds = 0;

  private intervalId: number;
  private destroyed = false;

  constructor(private eventService: EventService){}

  ngOnInit(): void {
    // One-time, summit-only fetch instead of a live whole-collection
    // streamAll() -- the banner only needs to pick the summit once, and the
    // countdown runs off a local interval, not Firestore (P3).
    this.eventService.getAllByValue('isSummit', true).then((events) => {
      if (this.destroyed) {
        return;
      }
      this.dms = events.find((event) => event.isSummit);
      this.startCountdown();
    });
  }

  private startCountdown(): void {
    const endDate = toMillis(this.dms?.startDate);

    this.intervalId = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate - now;

      if (distance < 0) {
        clearInterval(this.intervalId);
      } else {
        this.days = Math.floor(distance / (1000 * 60 * 60 * 24));
        this.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        this.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        this.seconds = Math.floor((distance % (1000 * 60)) / 1000);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

}
