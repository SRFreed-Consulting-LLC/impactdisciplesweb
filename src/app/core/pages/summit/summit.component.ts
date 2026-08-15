import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QueryParam, WhereFilterOperandKeys } from 'src/app/common/dao/firebase.dao';
import { EventModel } from 'src/app/common/models/domain/event.model';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';
import { AgendaItem } from 'src/app/common/models/domain/utils/agenda-item.model';
import { CoachModel } from 'src/app/common/models/domain/coach.model';
import { CoachService } from 'src/app/common/services/data/coach.service';
import { EventService } from 'src/app/common/services/data/event.service';

@Component({
    selector: 'app-summit',
    templateUrl: './summit.component.html',
    styleUrls: ['./summit.component.scss'],
    standalone: false
})
export class SummitComponent implements OnInit, OnDestroy {

  summit: EventModel;
  coaches: CoachModel[] = [];
  currentIndex = 0;
  visibleSlides = 3;
  groupedAgendaItems: { monthYear: string; days: { date: Date; items: AgendaItem[] }[] }[] = [];

  public days = 0;
  public hours = 0;
  public minutes = 0;
  public seconds = 0;

  /** Only true while there is actually something ahead to count down to. */
  public counting = false;

  /**
   * False until the Firestore lookup has come back, so the template can tell
   * "still loading" apart from "there is no published summit for this year".
   * Without it, /summit/2027 rendered its not-found state as a bare promo
   * image with no date, no explanation and no way to register.
   */
  public loaded = false;

  /** The year segment from the route, used in the empty state's copy. */
  public year: number = new Date().getFullYear();

  isPlaying = false;

  private intervalId: number;

  constructor(private route: ActivatedRoute, private eventService: EventService, public utilsService: UtilsService, private coachService: CoachService) { }

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const year = Number(params.get('year'));
      this.year = year || new Date().getFullYear();
      this.loaded = false;

      const query = [
        // Was comparing startDate (a Firestore Timestamp field) against a
        // plain string ("2026-01-01") - Firestore inequality filters only
        // match same-typed values, so this silently matched zero documents
        // regardless of data, always falling into the "No summit event
        // found" branch below. A real Date converts to a Timestamp the same
        // way Firestore's own SDK does when passed to where().
        new QueryParam('startDate', WhereFilterOperandKeys.more, new Date(year + '-01-01')),
        new QueryParam('isSummit', WhereFilterOperandKeys.equal, true),
        new QueryParam('isActive', WhereFilterOperandKeys.equal, true)
      ]

      this.summit = await this.eventService.queryAllByMultiValue(query).then(events => {
        // `events.length == 1` meant that a year with more than one published
        // summit fell through to the not-found state. Take the earliest match
        // instead; the year filter already narrows it to one season.
        if (events?.length) {
          return [...events].sort((a, b) =>
            new Date(a.startDate.toString()).getTime() - new Date(b.startDate.toString()).getTime()
          )[0];
        }

        return null;
      });

      this.loaded = true;

      if(this.summit?.agendaItems) {
        this.groupAgendaItemsByMonthAndDate(this.summit.agendaItems);
        const coachIds = Array.from(
          new Set(
            this.summit.agendaItems.flatMap(item => item.coaches || [])
          )
        );

        if (coachIds.length > 0) {
          this.coachService.getAllByIds(coachIds).then((coaches) => {
            this.coaches = coaches;
            this.coaches.sort((a,b) => a.sortOrder - b.sortOrder)
          });
        }
      }
      this.startCountdown();
    });
  }

  private startCountdown(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    if (!this.summit?.startDate) {
      this.counting = false;
      return;
    }

    const target = new Date(this.summit.startDate.toString()).getTime();

    const tick = () => {
      const distance = target - Date.now();

      if (distance <= 0) {
        // The summit has started or is over. A clock reading all zeroes looks
        // like a bug, so the template swaps it for the date instead.
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

    tick();
    this.intervalId = setInterval(tick, 1000) as unknown as number;
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex > 0) ? this.currentIndex - 1 : this.coaches.length - this.visibleSlides;
  }

  nextSlide() {
    const maxIndex = this.coaches.length - this.visibleSlides;
    this.currentIndex = (this.currentIndex < maxIndex) ? this.currentIndex + 1 : 0;
  }

  getTransform() {
    return `translateX(-${this.currentIndex * (100 / this.visibleSlides)}%)`;
  }

  private groupAgendaItemsByMonthAndDate(agendaItems: AgendaItem[]) {
    agendaItems.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const groupedByMonthYear = agendaItems.reduce((acc, item) => {
      const monthYearKey = new Date(item.startDate).toLocaleString('default', { month: 'long', year: 'numeric' });
      const dateKey = new Date(item.startDate).toDateString();

      if (!acc[monthYearKey]) {
        acc[monthYearKey] = {};
      }

      if (!acc[monthYearKey][dateKey]) {
        acc[monthYearKey][dateKey] = [];
      }

      acc[monthYearKey][dateKey].push(item);
      return acc;
    }, {} as Record<string, Record<string, AgendaItem[]>>);

    this.groupedAgendaItems = Object.keys(groupedByMonthYear).map(monthYear => ({
      monthYear: monthYear,
      days: Object.keys(groupedByMonthYear[monthYear])
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map(date => ({
          date: new Date(date),
          items: groupedByMonthYear[monthYear][date],
        })),
    }));
  }

  playVideo(){
    this.isPlaying = true;
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

}
