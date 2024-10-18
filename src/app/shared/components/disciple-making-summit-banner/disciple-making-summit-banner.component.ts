import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { EventService } from 'impactdisciplescommon/src/services/data/event.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-disciple-making-summit-banner',
  templateUrl: './disciple-making-summit-banner.component.html',
  styleUrls: ['./disciple-making-summit-banner.component.scss']
})
export class DiscipleMakingSummitBannerComponent implements OnInit, OnDestroy {
  @Input() large: boolean = false;

  public dms: EventModel;
  public days: number = 0;
  public hours: number = 0;
  public minutes: number = 0;
  public seconds: number = 0;

  private intervalId: any;
  private ngUnsubscribe = new Subject<void>();

  constructor(private eventService: EventService){}

  ngOnInit(): void {
    this.eventService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((events) => {
      this.dms = events.find((event) => event.isSummit)
      this.startCountdown();
    });
  }

  private startCountdown(): void {
    const endDate = new Date(this.dms?.startDate.toString()).getTime();

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
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
