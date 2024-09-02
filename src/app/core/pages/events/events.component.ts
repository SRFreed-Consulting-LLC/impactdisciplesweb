import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { EventService } from 'impactdisciplescommon/src/services/event.service';
import { Subject, takeUntil } from 'rxjs';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import Swiper from 'swiper';
import { EffectFade, Pagination } from 'swiper/modules';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements AfterViewInit, OnInit, OnDestroy  {
  @ViewChild('heroSliderContainer') heroSliderContainer!: ElementRef;
  public swiperInstance: Swiper | undefined;
  public impactDisciplesInfo = impactDisciplesInfo;
  @Input() images: string[] = [
    'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Disciple-Making-Summit%2Fgroup-session-2.jpg?alt=media&token=9f6c7dad-e31b-4c9e-9eb9-7220cb122c5c',
    'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Disciple-Making-Summit%2Fgroup-session-3.png?alt=media&token=831cceb8-4c12-44ec-bada-40035dfec4d3',
    'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Disciple-Making-Summit%2Fgroup-session-4.jpg?alt=media&token=10a83f08-f8e1-49da-847a-ea50fd36c145',
    'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Disciple-Making-Summit%2Fworship-2.jpg?alt=media&token=f8ce6120-3b42-43ff-a335-10edfc535788',
    'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Disciple-Making-Summit%2Fwoprship-3.jpg?alt=media&token=8e55af9d-6d00-4e58-bb4e-1ef174efc997'
  ];

  eventsList: EventModel[] = [];

  currentIndex: number = 0;
  visibleSlides: number = 4;

  public days: number = 0;
  public hours: number = 0;
  public minutes: number = 0;
  public seconds: number = 0;

  private intervalId: any;
  private ngUnsubscribe = new Subject<void>();

  constructor(private eventService: EventService, private router: Router){}

  ngOnInit(): void {
    this.startCountdown();
    this.eventService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((events) => {
      this.eventsList = events;
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
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

  goToEventDetails(event: EventModel): void {
    this.router.navigate(['/event-details'], { state: { event } });
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex > 0) ? this.currentIndex - 1 : this.images.length - this.visibleSlides;
  }

  nextSlide() {
    const maxIndex = this.images.length - this.visibleSlides;
    this.currentIndex = (this.currentIndex < maxIndex) ? this.currentIndex + 1 : 0;
  }

  getTransform() {
    return `translateX(-${this.currentIndex * (100 / this.visibleSlides)}%)`;
  }

  private startCountdown(): void {
    const endDate = new Date(this.impactDisciplesInfo.yearEventCountdown).getTime();

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

}
