import { Component, OnDestroy, OnInit } from '@angular/core';
import { CourseModel } from 'src/app/common/models/domain/course.model';
import { TrainingRoomModel } from 'src/app/common/models/domain/training-room.model';
import { CustomerModel } from 'src/app/common/models/domain/utils/customer.model';
import { EventModel } from 'src/app/common/models/domain/event.model';
import { DialogService } from 'src/app/shared/utils/services/dialog.service';
import { EventService } from 'src/app/common/services/data/event.service';
import { EventRegistrationModel } from 'src/app/common/models/domain/event-registration.model';
import { CoachModel } from 'src/app/common/models/domain/coach.model';
import { ScheduleModel, TimeGroupsModel, UpdatedAgendaItemModel } from 'src/app/common/models/utils/schedule.model';
import { ScheduleService } from 'src/app/common/services/utils/schedule.service';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { AgendaItem } from 'src/app/common/models/domain/utils/agenda-item.model';
import { EventRegistrationService } from 'src/app/common/services/data/event-registration.service';
import { formatDate } from '@angular/common';
import { ScheduleEventBusService } from '../schedule-event-bus.service';

@Component({
    selector: 'app-breakout-sessions',
    templateUrl: './breakout-sessions.component.html',
    styleUrls: ['./breakout-sessions.component.scss'],
    standalone: false
})
export class BreakoutSessionsComponent implements OnInit, OnDestroy{
  allCourses: ScheduleModel[];
  myCourses: ScheduleModel[];
  currentUser: CustomerModel | EventRegistrationModel;
  event: EventModel;
  coursesList: CourseModel[] = [];
  coachesList: CoachModel[] = [];
  roomsList: TrainingRoomModel[] = [];
  selectedTimegroup: TimeGroupsModel;

  // Looked up by id from the *ngFor templates on every change-detection
  // cycle (getCourse/getRoomName/getCoach*) -- Maps give O(1) lookups
  // instead of re-scanning the full list with .find() each time.
  private coursesMap = new Map<string, CourseModel>();
  private coachesMap = new Map<string, CoachModel>();
  private roomsMap = new Map<string, TrainingRoomModel>();

  public isVisible$ = new BehaviorSubject<boolean>(false);
  private ngUnsubscribe = new Subject<void>();

  constructor(
    private scheduleEventBus: ScheduleEventBusService,
    private eventRegistrationService: EventRegistrationService,
    private scheduleService: ScheduleService,
    private eventService: EventService,
    private dialogService: DialogService) { }

    async ngOnInit(): Promise<void> {

      this.scheduleEventBus.showBreakoutSessionsModal.pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(({ allCourses, myCourses, currentUser, event, coursesList, coachesList, roomsList, timeGroup }) => {
        this.allCourses = allCourses;
        this.myCourses = myCourses;
        this.currentUser = currentUser;
        this.event = event;
        this.coursesList = coursesList;
        this.coachesList = coachesList;
        this.roomsList = roomsList
        this.selectedTimegroup = timeGroup;

        this.coursesMap = new Map(this.coursesList.map(course => [course.id, course]));
        this.coachesMap = new Map(this.coachesList.map(coach => [coach.id, coach]));
        this.roomsMap = new Map(this.roomsList.map(room => [room.id, room]));

        this.isVisible$.next(true);
      })
    }

  getCourse(id: string){
    return this.coursesMap.get(id) || null;
  }

  getRoomName(id: string){
    return this.roomsMap.get(id)?.name || '';
  }

  getCourseTitle(course:CourseModel){
    if(course && course.title){
      return course.title.replace("Breakout: ", "");
    } else {
      return '';
    }
  }
  getCoachImg(id: string){
    return this.coachesMap.get(id)?.photoUrl.url || '';
  }

  getCoachName(id: string){
    return this.coachesMap.get(id)?.fullname || '';
  }

  getCoachTitle(id: string){
    return this.coachesMap.get(id)?.title || '';
  }

  viewCourse(item: UpdatedAgendaItemModel) {
    if(item.item.isCourse){
      if(this.viewCourseCapcaity(item.item.id) < item.item.maxParticipants){
        const course: CourseModel = this.getCourse(item.item.course);
        this.scheduleEventBus.dispatchShowCourseModal({
          customAgendaItem: item,
          course: course,
          currentUser: this.currentUser,
          event: this.event,
          allCourses: this.allCourses,
          coachesList: this.coachesList,
          roomsList: this.roomsList
        });
      } else {
        this.dialogService.confirm('<i>This session is currently Full. Would you like to be added to the "Wait List"?</i>', 'Session is Full').then(async (dialogResult) => {
          if (dialogResult) {
            if(!item.item.waitList){
              item.item.waitList = [];
            }

            item.item.waitList.push(this.currentUser.email);

            await this.eventService.getById(this.event.id).then(e => {
              const agendaItemId = e.agendaItems.findIndex(agendaItem=> agendaItem.id == item.item.id);

              e.agendaItems[agendaItemId] = item.item;

              this.event = e;

              this.dialogService.alert('<i>You have been successfully added to the waitList</i>', 'Registration Success').then(() => {
                this.scheduleEventBus.dispatchResetSchedule();
                this.isVisible$.next(false);
              })
            })

            //add user to wait list
            //pop up a success message
          }
        })
      }
    }
  }

  addCourse(course: AgendaItem) {
    const conflictingCourse = this.allCourses
      .flatMap(group => group.days)
      .flatMap(day => day.timeGroups)
      .flatMap(timeGroup => timeGroup.items)
      .find(item =>
        item.isAssignedToUser &&
        new Date(item.item.startDate).getTime() === new Date(course.startDate).getTime() &&
        item.item.course !== course.course
      );

    if (conflictingCourse) {
      this.dialogService.confirm('<i>You are already assigned to a course at this time. Would you like to remove that course and add the new one?</i>', 'Confirm').then((dialogResult) => {
        if (dialogResult) {
          this.eventRegistrationService
          .unregisterForTrainingSession(this.currentUser.id, conflictingCourse.item.id)
          .then(() => {
            this.eventRegistrationService
              .registerForTrainingSession(this.currentUser.id, course.id)
              .then(() => {
                this.dialogService.alert('<i>You have been successfully registered for ' + this.getCourse(course.course).title + "' at " + formatDate(course.startDate, 'shortTime', 'en-US') + '</i>', 'Registration Success').then(() => {
                  this.scheduleEventBus.dispatchResetSchedule();
                  this.isVisible$.next(false);
                })
              });
          });
        }
      });
    } else {
      // Directly add the course if no conflict
      this.eventRegistrationService
        .registerForTrainingSession(this.currentUser.id, course.id)
        .then(() => {
          this.dialogService.alert('<i>You have been successfully registered for ' + this.getCourse(course.course).title + "' at " + formatDate(course.startDate, 'shortTime', 'en-US') + '</i>', 'Registration Success').then(() => {
            this.scheduleEventBus.dispatchResetSchedule();
            this.isVisible$.next(false);
          })
        });
    }
  }

  removeCourse(course: AgendaItem) {
    this.dialogService.confirm('<i>Are you sure you want to remove this course from your schedule?</i>', 'Confirm').then((dialogResult) => {
      if (dialogResult) {
        this.eventRegistrationService
        .unregisterForTrainingSession(this.currentUser.id, course.id)
        .then(() => {
          this.dialogService.alert('<i>You have been successfully removed from ' + this.getCourse(course.course).title + "' at " + formatDate(course.startDate, 'shortTime', 'en-US') + '</i>', 'Registration Removed').then(() => {
            this.scheduleEventBus.dispatchResetSchedule();
            this.isVisible$.next(false);
          })

        });
      }
    });
  }

  onCancel(){
    this.isVisible$.next(false);
  }

  viewCourseCapcaity(item: string) {
    return this.scheduleService.traininlist.get(item) || 0;
  }

resizePopup() {
  const viewportWidth = window.innerWidth;
  const popupWidth = viewportWidth < 768 ? '100%' : '50%';
  return popupWidth
}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
