import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { toMillis } from 'src/app/common/utils/date-from-timestamp';
import { EventModel } from 'src/app/common/models/domain/event.model';
import { EventService } from 'src/app/common/services/data/event.service';
import { Subject, takeUntil } from 'rxjs';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import Swiper from 'swiper';
import { EffectFade, Pagination } from 'swiper/modules';

@Component({
    selector: 'app-events',
    templateUrl: './events.component.html',
    styleUrls: ['./events.component.scss'],
    standalone: false
})
export class EventsComponent implements AfterViewInit, OnInit, OnDestroy  {
  @ViewChild('heroSliderContainer') heroSliderContainer!: ElementRef;
  public swiperInstance: Swiper | undefined;
  public dms: EventModel;
  public impactDisciplesInfo = impactDisciplesInfo;

  eventsList: EventModel[] = [];

  isSummitPosted = false;

  onlineEventsList: EventModel[];

  private ngUnsubscribe = new Subject<void>();

  constructor(private eventService: EventService){}

  ngOnInit(): void {
    this.eventService.streamAllByValue('isActive', true).pipe(takeUntil(this.ngUnsubscribe)).subscribe(async (events) => {
      const  currentDate = new Date();
      currentDate.setDate(new Date().getDate() -1);

      this.dms = events.find(event => event.isSummit);

      this.isSummitPosted = await this.eventService.isSummitPosted();

      this.eventsList = events.filter(event => {
        const eventEndDate = new Date(event.endDate.toString());
        return eventEndDate >= currentDate && !event.isOnline;
      });

      this.eventsList.sort((a, b) => {
        if (a.isSummit && !b.isSummit) {
          return -1;
        } else if (!a.isSummit && b.isSummit) {
          return 1;
        } else {
          return 0;
        }
      });

      this.onlineEventsList = events.filter(event => {
        const eventStartDate = new Date(event.endDate.toString());
        return eventStartDate >= currentDate && event.isOnline;
      });

      const dateSorter = (a,b) => {
        return toMillis(a.startDate) - toMillis(b.startDate)
      };

      this.eventsList.sort(dateSorter);
      this.onlineEventsList.sort(dateSorter);
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngAfterViewInit() {
    if (this.heroSliderContainer) {
      this.swiperInstance = new Swiper('.slider-active', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: false,
        effect: 'fade',
        modules: [Pagination, EffectFade],
        pagination: {
          clickable: true,
          el: '.tp-slider-dot',
        },
      });
    }
  }

}
