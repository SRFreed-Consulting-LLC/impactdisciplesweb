import { Component, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toMillis } from '@impact-common/shared/utils/date-from-timestamp';
import { TrainingRoomModel } from '@impact-common/shared/models/domain/training-room.model';
import { CustomerModel } from 'src/app/common/models/domain/utils/customer.model';
import { EventModel } from '@impact-common/shared/models/domain/event.model';
import { DialogService } from 'src/app/shared/utils/services/dialog.service';
import { EventRegistrationModel } from '@impact-common/shared/models/domain/event-registration.model';
import { CoachModel } from '@impact-common/shared/models/domain/coach.model';
import { ScheduleModel, TimeGroupsModel } from 'src/app/common/models/utils/schedule.model';
import { ScheduleService } from 'src/app/common/services/utils/schedule.service';
import { BehaviorSubject } from 'rxjs';
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
export class BreakoutSessionsComponent implements OnInit{
  allCourses: ScheduleModel[];
  myCourses: ScheduleModel[];
  currentUser: CustomerModel | EventRegistrationModel;
  event: EventModel;
  coachesList: CoachModel[] = [];
  roomsList: TrainingRoomModel[] = [];
  selectedTimegroup: TimeGroupsModel;

  // Looked up by id from the *ngFor templates on every change-detection
  // cycle (getCourse/getRoomName/getCoach*) -- Maps give O(1) lookups
  // instead of re-scanning the full list with .find() each time.
  private coachesMap = new Map<string, CoachModel>();
  private roomsMap = new Map<string, TrainingRoomModel>();

  public isVisible$ = new BehaviorSubject<boolean>(false);

  constructor(
    private scheduleEventBus: ScheduleEventBusService,
    private eventRegistrationService: EventRegistrationService,
    private scheduleService: ScheduleService,
    private dialogService: DialogService,
    private destroyRef: DestroyRef
  ) { }

    async ngOnInit(): Promise<void> {

      this.scheduleEventBus.showBreakoutSessionsModal.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(({ allCourses, myCourses, currentUser, event, coachesList, roomsList, timeGroup }) => {
        this.allCourses = allCourses;
        this.myCourses = myCourses;
        this.currentUser = currentUser;
        this.event = event;
        this.coachesList = coachesList;
        this.roomsList = roomsList
        this.selectedTimegroup = timeGroup;

        this.coachesMap = new Map(this.coachesList.map(coach => [coach.id, coach]));
        this.roomsMap = new Map(this.roomsList.map(room => [room.id, room]));

        this.isVisible$.next(true);
      })
    }

  getRoomName(id: string){
    return this.roomsMap.get(id)?.name || '';
  }

  // The item carries its own title and description - see breakout.util.ts.
  // Both used to fall back to a courses/{id} lookup, which is what getCourse
  // and the coursesMap existed for; the collection is gone (2026-09-01).
  getTitle(item: AgendaItem){
    return breakoutTitle(item);
  }

  getDescription(item: AgendaItem){
    return breakoutDescription(item);
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

}
