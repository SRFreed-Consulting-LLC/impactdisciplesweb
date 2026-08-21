import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toMillis } from '@impact-common/shared/utils/date-from-timestamp';
import { EventModel } from '@impact-common/shared/models/domain/event.model';
import { EventService } from 'src/app/common/services/data/event.service';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import Swiper from 'swiper';
import { EffectFade, Pagination } from 'swiper/modules';

@Component({
    selector: 'app-events',
    templateUrl: './events.component.html',
    styleUrls: ['./events.component.scss'],
    standalone: false
})
export class EventsComponent implements AfterViewInit, OnInit  {
  @ViewChild('heroSliderContainer') heroSliderContainer!: ElementRef;
  public swiperInstance: Swiper | undefined;
  public dms: EventModel;
  public impactDisciplesInfo = impactDisciplesInfo;

  eventsList: EventModel[] = [];

  isSummitPosted = false;

  onlineEventsList: EventModel[];

  constructor(private eventService: EventService, private destroyRef: DestroyRef){}

  ngOnInit(): void {
    this.eventService.streamAllByValue('isActive', true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (events) => {
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
