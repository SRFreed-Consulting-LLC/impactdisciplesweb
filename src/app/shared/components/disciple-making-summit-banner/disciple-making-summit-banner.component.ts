import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EventModel } from 'src/app/common/models/domain/event.model';
import { EventService } from 'src/app/common/services/data/event.service';
import { Subject, takeUntil } from 'rxjs';

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

  /** True once a summit has been chosen and its start date is still ahead. */
  public counting = false;

  /** Year segment for the /summit/:year link, derived from the chosen event. */
  public summitYear: number = new Date().getFullYear();

  private intervalId: number;
  private ngUnsubscribe = new Subject<void>();

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.eventService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((events) => {
      this.dms = this.pickSummit(events);
      this.summitYear = this.dms
        ? new Date(this.dms.startDate.toString()).getFullYear()
        : new Date().getFullYear();
      this.startCountdown();
    });
  }

  // `events.find(e => e.isSummit)` picked whichever summit Firestore happened to
  // return first, which is how the homepage ended up counting down to a summit
  // that had already happened and showing 00:00:00:00. Choose the next summit
  // that hasn't started yet; if every summit is in the past, fall back to the
  // most recent one so the band can still link somewhere sensible.
  private pickSummit(events: EventModel[]): EventModel | undefined {
    const summits = (events || []).filter(e => e.isSummit && e.startDate);
    if (!summits.length) return undefined;

    const now = Date.now();
    const startOf = (e: EventModel) => new Date(e.startDate.toString()).getTime();

    const upcoming = summits
      .filter(e => startOf(e) > now)
      .sort((a, b) => startOf(a) - startOf(b));

    if (upcoming.length) {
      // Prefer an active one; a summit that exists but isn't published yet
      // shouldn't win over one that is.
      return upcoming.find(e => e.isActive) ?? upcoming[0];
    }

    return summits.sort((a, b) => startOf(b) - startOf(a))[0];
  }

  private startCountdown(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    if (!this.dms?.startDate) {
      this.counting = false;
      return;
    }

    const target = new Date(this.dms.startDate.toString()).getTime();

    const tick = () => {
      const distance = target - Date.now();

      if (distance <= 0) {
        this.counting = false;
        clearInterval(this.intervalId);
        this.intervalId = undefined;
        return;
      }

      this.counting = true;
      this.days = Math.floor(distance / (1000 * 60 * 60 * 24));
      this.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      this.seconds = Math.floor((distance % (1000 * 60)) / 1000);
    };

    tick(); // paint immediately rather than after a one-second gap
    this.intervalId = setInterval(tick, 1000) as unknown as number;
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
