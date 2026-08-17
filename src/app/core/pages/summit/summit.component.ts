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

  isPlaying = false;

  private intervalId: number;

  constructor(private route: ActivatedRoute, private eventService: EventService, public utilsService: UtilsService, private coachService: CoachService) { }

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const year = Number(params.get('year'));

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

      // "No summit for the requested year" is an EXPECTED state, not an
      // error - the nav links to next year's summit before its event doc
      // exists (e.g. /summit/2027 while only 2026 is created). Fall back
      // to the next upcoming active summit so the page stays registerable
      // (register button -> event-details -> cart) whenever ANY summit is
      // on sale; only the static teaser renders when none is. The page
      // lights up automatically once the year's event doc is created with
      // isSummit + isActive. Multiple matches pick the soonest rather
      // than bailing (the old `length == 1` check returned null - and
      // console.error'd - the moment TWO future summits existed).
      this.summit = await this.eventService.queryAllByMultiValue(query).then(events => {
        if (events && events.length > 0) {
          return this.soonest(events);
        }
        console.warn('No summit event found for ' + year + ' - checking for next upcoming summit');
        return this.eventService.queryAllByMultiValue([
          new QueryParam('startDate', WhereFilterOperandKeys.more, new Date()),
          new QueryParam('isSummit', WhereFilterOperandKeys.equal, true),
          new QueryParam('isActive', WhereFilterOperandKeys.equal, true)
        ]).then(upcoming => {
          if (upcoming && upcoming.length > 0) {
            return this.soonest(upcoming);
          }
          console.warn('No upcoming summit on sale - showing the static teaser');
          return null;
        });
      });

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

  /** Soonest-starting event of a result set - used instead of assuming the
   *  summit query returns exactly one match. */
  private soonest(events: EventModel[]): EventModel {
    return [...events].sort(
      (a, b) => new Date(a.startDate.toString()).getTime() - new Date(b.startDate.toString()).getTime()
    )[0];
  }

  private startCountdown(): void {
    if (!this.summit?.startDate) {
      // Static-teaser mode (no summit on sale) - a countdown against
      // nothing just ticks NaN into the template every second.
      return;
    }
    const endDate = new Date(this.summit.startDate.toString()).getTime();

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
