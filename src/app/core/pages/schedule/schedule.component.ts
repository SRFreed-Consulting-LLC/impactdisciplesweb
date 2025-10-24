import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { Tab } from 'impactdisciplescommon/src/models/utils/tab.model';
import { Subject, takeUntil } from 'rxjs';
import { CustomerModel } from 'impactdisciplescommon/src/models/domain/utils/customer.model';
import { EventRegistrationService } from 'impactdisciplescommon/src/services/data/event-registration.service';
import { Actions, ofActionDispatched, Store } from '@ngxs/store';
import { ResetSchedule } from './schedule.actions';
import { EventRegistrationModel } from 'impactdisciplescommon/src/models/domain/event-registration.model';
import { EventService } from 'impactdisciplescommon/src/services/data/event.service';
import { CoachModel } from 'impactdisciplescommon/src/models/domain/coach.model';
import { CourseModel } from 'impactdisciplescommon/src/models/domain/course.model';
import { TrainingRoomModel } from 'impactdisciplescommon/src/models/domain/training-room.model';
import { LocationService } from 'impactdisciplescommon/src/services/data/location.service';
import { CoachService } from 'impactdisciplescommon/src/services/data/coach.service';
import { CourseService } from 'impactdisciplescommon/src/services/data/course.service';
import { ScheduleModel, TimeGroupsModel } from 'impactdisciplescommon/src/models/utils/schedule.model';
import { ScheduleService } from 'impactdisciplescommon/src/services/utils/schedule.service';
import { AuthService } from 'impactdisciplespwacommon/src/services/events/auth.service';
import { ActivatedRoute } from '@angular/router';
import { ShowCourseModal } from './course-modal/course-modal.actions';
import { AgendaItem } from 'impactdisciplescommon/src/models/domain/utils/agenda-item.model';
import { BreakoutSessionModal } from './breakout-sessions/breakout-sessions-modal.actions';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit, OnDestroy {
  event: EventModel;
  currentUser: CustomerModel | EventRegistrationModel;
  activeDay: any;
  allCourses: ScheduleModel[];
  fullSchedule: ScheduleModel[];
  myCourses: ScheduleModel[];
  sessionIds: string[]

  coursesList: CourseModel[] = [];
  coachesList: CoachModel[] = [];
  roomsList: TrainingRoomModel[] = [];

  private ngUnsubscribe = new Subject<void>();

  visible: boolean = false;

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private eventRegistrationService: EventRegistrationService,
    private scheduleService: ScheduleService,
    private actions$: Actions,
    private store: Store,
    private locationService: LocationService,
    private courseService: CourseService,
    private coachService: CoachService) { }

  async ngOnInit() {
    let eventId = this.route.snapshot.paramMap.get('event-id');

    let registrationId = this.route.snapshot.paramMap.get('registration-id');

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

            this.scheduleService.monitorBreakoutCapacity(this.event);

            this.actions$.pipe(ofActionDispatched(ResetSchedule), takeUntil(this.ngUnsubscribe)).subscribe(async () => {
              await this.updateSchedule();
            });

            this.store.dispatch(new ResetSchedule());

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

  sendNotification(message: string, type: string){
    notify({
      message: message,
      position: 'top',
      type: type
    });
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
      .flatMap((monthGroup: any) => monthGroup.days)
      .filter((dayGroup: any) => new Date(dayGroup.date) >= today);

    this.activeDay = futureDates.length > 0 ? futureDates[0] : this.fullSchedule[0]?.days[0];
  }

  setActiveDay(dayGroup: any) {
    this.activeDay = dayGroup;
  }

  onNavigateToBreakouts(timeGroup: TimeGroupsModel) {
    this.store.dispatch(new BreakoutSessionModal(this.allCourses, this.myCourses, this.currentUser, this.event, this.coursesList, this.coachesList, this.roomsList, timeGroup));
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
    let course: CourseModel = this.coursesList.find(course => course.id == id);

    if(course){
      return course
    } else {
      return null;
    }
  }

  getRoomName(id: string){
    let room: TrainingRoomModel = this.roomsList.find(item => item.id == id);

    if(room){
      return room.name
    } else {
      return '';
    }
  }

  getCoachList(coaches: string[]){
    let coachList: string[] = [];

    coaches.forEach(coach => {
      coachList.push(this.getCoachName(coach))
    })

    return coachList.join(", ");
  }

  getCoachName(id: string){
    let coach: CoachModel = this.coachesList.find(item => item.id == id);

    if(coach){
      return coach.fullname
    } else {
      return '';
    }
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}


