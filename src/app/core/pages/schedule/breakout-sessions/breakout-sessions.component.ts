import { Component, OnDestroy, OnInit } from '@angular/core';
import { toMillis } from '@impact-common/shared/utils/date-from-timestamp';
import { CourseModel } from '@impact-common/shared/models/domain/course.model';
import { TrainingRoomModel } from '@impact-common/shared/models/domain/training-room.model';
import { CustomerModel } from 'src/app/common/models/domain/utils/customer.model';
import { EventModel } from '@impact-common/shared/models/domain/event.model';
import { DialogService } from 'src/app/shared/utils/services/dialog.service';
import { EventRegistrationModel } from '@impact-common/shared/models/domain/event-registration.model';
import { CoachModel } from '@impact-common/shared/models/domain/coach.model';
import { ScheduleModel, TimeGroupsModel } from 'src/app/common/models/utils/schedule.model';
import { ScheduleService } from 'src/app/common/services/utils/schedule.service';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { AgendaItem } from '@impact-common/shared/models/domain/utils/agenda-item.model';
import { EventRegistrationService } from 'src/app/common/services/data/event-registration.service';
import { formatDate } from '@angular/common';
import { ScheduleEventBusService } from '../schedule-event-bus.service';
import { breakoutDescription, breakoutTitle, sameBreakoutSession } from 'src/app/shared/utils/breakout.util';

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

  // Item-first with legacy course fallback - see breakout.util.ts (2026-08
  // Courses retirement).
  getTitle(item: AgendaItem){
    return breakoutTitle(item, item?.course ? this.getCourse(item.course) : null);
  }

  getDescription(item: AgendaItem){
    return breakoutDescription(item, item?.course ? this.getCourse(item.course) : null);
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

  addCourse(course: AgendaItem) {
    const conflictingCourse = this.allCourses
      .flatMap(group => group.days)
      .flatMap(day => day.timeGroups)
      .flatMap(timeGroup => timeGroup.items)
      .find(item =>
        item.isAssignedToUser &&
        toMillis(item.item.startDate) === toMillis(course.startDate) &&
        !sameBreakoutSession(item.item, course)
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
                this.dialogService.alert('<i>You have been successfully registered for ' + this.getTitle(course) + "' at " + formatDate(course.startDate, 'shortTime', 'en-US') + '</i>', 'Registration Success').then(() => {
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
          this.dialogService.alert('<i>You have been successfully registered for ' + this.getTitle(course) + "' at " + formatDate(course.startDate, 'shortTime', 'en-US') + '</i>', 'Registration Success').then(() => {
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
          this.dialogService.alert('<i>You have been successfully removed from ' + this.getTitle(course) + "' at " + formatDate(course.startDate, 'shortTime', 'en-US') + '</i>', 'Registration Removed').then(() => {
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
