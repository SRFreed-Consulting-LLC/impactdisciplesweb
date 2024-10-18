import { query } from '@angular/fire/firestore';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QueryParam, WhereFilterOperandKeys } from 'impactdisciplescommon/src/dao/firebase.dao';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';
import { AgendaItem } from 'impactdisciplescommon/src/models/domain/utils/agenda-item.model';
import { CoachModel } from 'impactdisciplescommon/src/models/domain/coach.model';
import { forkJoin } from 'rxjs';
import { CoachService } from 'impactdisciplescommon/src/services/data/coach.service';
import { EventService } from 'impactdisciplescommon/src/services/data/event.service';

interface GroupedAgendaItem {
  startDate: string;
  endDate: string;
  courses: string[];
  nonCourses: string[];
}

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit, OnDestroy {

  summit: EventModel;
  coaches: CoachModel[] = [];
  currentIndex: number = 0;
  visibleSlides: number = 3;
  groupedAgendaItems: { monthYear: string; days: { date: Date; items: AgendaItem[] }[] }[] = [];

  public days: number = 0;
  public hours: number = 0;
  public minutes: number = 0;
  public seconds: number = 0;


  private intervalId: any;

  constructor(private route: ActivatedRoute, private eventService: EventService, public utilsService: UtilsService, private coachService: CoachService) { }

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      let year = Number(params.get('year'));
      let query = [
        new QueryParam('startDate', WhereFilterOperandKeys.more, new Date('1/1/' +(year))),
        new QueryParam('isSummit', WhereFilterOperandKeys.equal, true)
      ]

      this.summit = await this.eventService.queryAllByMultiValue(query).then(events => {
        if(events && events.length == 1){
          return events[0]
        } else {
          console.error('No summit event found for ' + year);

          return null;
        }

      });
      if(this.summit.agendaItems) {
        this.groupAgendaItemsByMonthAndDate(this.summit.agendaItems);
        const coachIds = Array.from(
          new Set(
            this.summit.agendaItems.flatMap(item => item.coaches || [])
          )
        );

        if (coachIds.length > 0) {
          const coachObservables = coachIds.map(id => this.coachService.getById(id));

          forkJoin(coachObservables).subscribe((coaches) => {
            this.coaches = coaches;
          });
        }
      }
      this.startCountdown();
    });
  }

  private startCountdown(): void {
    const endDate = new Date(this.summit?.startDate.toString()).getTime();

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
    }, {} as { [monthYear: string]: { [date: string]: AgendaItem[] } });

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

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

}
