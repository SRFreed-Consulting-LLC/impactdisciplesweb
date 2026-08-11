import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventModel } from 'src/app/common/models/domain/event.model';
import { Subject, takeUntil } from 'rxjs';
import { CustomerModel } from 'src/app/common/models/domain/utils/customer.model';
import { EventRegistrationService } from 'src/app/common/services/data/event-registration.service';
import { EventRegistrationModel } from 'src/app/common/models/domain/event-registration.model';
import { EventService } from 'src/app/common/services/data/event.service';
import { CoachModel } from 'src/app/common/models/domain/coach.model';
import { CourseModel } from 'src/app/common/models/domain/course.model';
import { TrainingRoomModel } from 'src/app/common/models/domain/training-room.model';
import { LocationService } from 'src/app/common/services/data/location.service';
import { CoachService } from 'src/app/common/services/data/coach.service';
import { CourseService } from 'src/app/common/services/data/course.service';
import { DaysModel, ScheduleModel, TimeGroupsModel } from 'src/app/common/models/utils/schedule.model';
import { ScheduleService } from 'src/app/common/services/utils/schedule.service';
import { ActivatedRoute } from '@angular/router';
import { AgendaItem } from 'src/app/common/models/domain/utils/agenda-item.model';
import { ScheduleEventBusService } from './schedule-event-bus.service';
import { ToastService, ToastType } from 'src/app/shared/utils/services/toast.service';

@Component({
    selector: 'app-schedule',
    templateUrl: './schedule.component.html',
    styleUrls: ['./schedule.component.scss'],
    standalone: false
})
export class ScheduleComponent implements OnInit, OnDestroy {
  event: EventModel;
  currentUser: CustomerModel | EventRegistrationModel;
  activeDay: DaysModel;
  allCourses: ScheduleModel[];
  fullSchedule: ScheduleModel[];
  myCourses: ScheduleModel[];
  sessionIds: string[]

  coursesList: CourseModel[] = [];
  coachesList: CoachModel[] = [];
  roomsList: TrainingRoomModel[] = [];

  // Looked up by id from the *ngFor template on every change-detection
  // cycle (getCourse/getRoomName/getCoachName) -- Maps give O(1) lookups
  // instead of re-scanning the full list with .find() each time.
  private coursesMap = new Map<string, CourseModel>();
  private coachesMap = new Map<string, CoachModel>();
  private roomsMap = new Map<string, TrainingRoomModel>();

  private ngUnsubscribe = new Subject<void>();

  visible = false;

  constructor(
    private eventService: EventService,
    private route: ActivatedRoute,
    private eventRegistrationService: EventRegistrationService,
    private scheduleService: ScheduleService,
    private scheduleEventBus: ScheduleEventBusService,
    private locationService: LocationService,
    private courseService: CourseService,
    private coachService: CoachService,
    private toastService: ToastService) { }

  async ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('event-id');

    const registrationId = this.route.snapshot.paramMap.get('registration-id');

    if(eventId){
      this.eventService.streamAllByValue('id', eventId).pipe(takeUntil(this.ngUnsubscribe)).subscribe(async events => {
        if(registrationId){
          this.currentUser = await this.eventRegistrationService.getEventRegistrationById(registrationId);

          if(this.currentUser){
            this.event = events[0];

            this.coursesList = await this.courseService.getAll();

            this.coachesList = await this.coachService.getAll();

            this.roomsList = await this.locationService.getById(typeof this.event.location=='string'? this.event.location : this.event.location.id).then(location => {
              return location.trainingrooms;
            })

            this.coursesMap = new Map(this.coursesList.map(course => [course.id, course]));
            this.coachesMap = new Map(this.coachesList.map(coach => [coach.id, coach]));
            this.roomsMap = new Map(this.roomsList.map(room => [room.id, room]));

            this.scheduleService.monitorBreakoutCapacity(this.event);

            this.scheduleEventBus.resetSchedule.pipe(takeUntil(this.ngUnsubscribe)).subscribe(async () => {
              await this.updateSchedule();
            });

            this.scheduleEventBus.dispatchResetSchedule();

            this.visible = true;
          } else {
            this.sendNotification('Oops! We could not find your Registration for the Event requested!', 'error');
          }
        } else {
          this.sendNotification('Oops! A Registration ID was not recevied for the Event requested!', 'error');
        }
      })
    } else {
      this.sendNotification('Oops! An Event ID was not recevied in this request', 'error');
    }
  }

  sendNotification(message: string, type: ToastType){
    this.toastService.notify({ message, type });
  }

  private async updateSchedule() {
    // Fetch session IDs and organize schedules
    this.scheduleService.sessionIds = await this.eventRegistrationService.getUserTrainingSession(
      this.currentUser?.email,
      this.event.id
    );
    this.scheduleService.organizeAgendaItems(this.event.agendaItems);

    // Update local properties from AgendaService
    this.updateLocalSchedules();
    this.preselectActiveDay();
  }

  private updateLocalSchedules() {
    this.fullSchedule = this.scheduleService.fullSchedule;
    this.myCourses = this.scheduleService.myCourses;
    this.allCourses = this.scheduleService.allCourses;
  }

  preselectActiveDay() {
    const today = new Date();
    const futureDates = this.fullSchedule
      .flatMap((monthGroup: ScheduleModel) => monthGroup.days)
      .filter((dayGroup: DaysModel) => new Date(dayGroup.date) >= today);

    this.activeDay = futureDates.length > 0 ? futureDates[0] : this.fullSchedule[0]?.days[0];
  }

  setActiveDay(dayGroup: DaysModel) {
    this.activeDay = dayGroup;
  }

  onNavigateToBreakouts(timeGroup: TimeGroupsModel) {
    this.scheduleEventBus.dispatchShowBreakoutSessionsModal({
      allCourses: this.allCourses,
      myCourses: this.myCourses,
      currentUser: this.currentUser,
      event: this.event,
      coursesList: this.coursesList,
      coachesList: this.coachesList,
      roomsList: this.roomsList,
      timeGroup: timeGroup
    });
  }

  isAnyItemAssignedInGroup(timeGroup: { date: Date; items: { isAssignedToUser: boolean; item: AgendaItem }[] }): boolean {
    return timeGroup.items.some(item => item.isAssignedToUser);
  }

  getCourseTitle(course:CourseModel){
    if(course && course.title){
      return course.title.replace("Breakout: ", "");
    } else {
      return '';
    }
  }

  getCourse(id: string){
    return this.coursesMap.get(id) || null;
  }

  getRoomName(id: string){
    return this.roomsMap.get(id)?.name || '';
  }

  getCoachList(coaches: string[]){
    const coachList: string[] = [];

    coaches.forEach(coach => {
      coachList.push(this.getCoachName(coach))
    })

    return coachList.join(", ");
  }

  getCoachName(id: string){
    return this.coachesMap.get(id)?.fullname || '';
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}


