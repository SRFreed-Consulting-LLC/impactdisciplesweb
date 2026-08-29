import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { toMillis } from '@impact-common/shared/utils/date-from-timestamp';
import { EventModel } from '@impact-common/shared/models/domain/event.model';
import { EventService } from 'src/app/common/services/data/event.service';

/**
 * The Disciple-Making Summit banner: a background, a heading, a live
 * countdown and a register button.
 *
 * The COUNTDOWN and the register link come from the summit EVENT, not from
 * a section record - a date staff can type on a page would drift from the
 * event it is counting down to. Only the presentation is editable.
 *
 * Used on the home page and the events page, so the defaults have to stand
 * on their own: the events page passes nothing.
 */
@Component({
    selector: 'app-disciple-making-summit-banner',
    templateUrl: './disciple-making-summit-banner.component.html',
    styleUrls: ['./disciple-making-summit-banner.component.scss'],
    standalone: false
})
export class DiscipleMakingSummitBannerComponent implements OnInit, OnDestroy {
  /** Rendered as two lines: everything before the last word, then the word. */
  @Input() title = 'DISCIPLE-MAKING SUMMIT';

  @Input() backgroundUrl =
    'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/' +
    'Web-Pages%2FShared%2Fsummit-banner-large.PNG?alt=media&token=74f6f522-2b3e-48f0-bdb9-2b363abbe80e';

  @Input() ctaTitle = 'REGISTER NOW';

  public dms: EventModel;
  public days = 0;
  public hours = 0;
  public minutes = 0;
  public seconds = 0;

  private intervalId: number;
  private destroyed = false;

  constructor(private eventService: EventService){}

  /**
   * The heading is drawn with its last word in the accent colour, which the
   * template used to do with a hardcoded <span>. Splitting here keeps that
   * treatment working for whatever staff type.
   */
  get titleLead(): string {
    const words = (this.title ?? '').trim().split(/\s+/);
    return words.slice(0, -1).join(' ');
  }

  get titleAccent(): string {
    const words = (this.title ?? '').trim().split(/\s+/);
    return words.length ? words[words.length - 1] : '';
  }

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
