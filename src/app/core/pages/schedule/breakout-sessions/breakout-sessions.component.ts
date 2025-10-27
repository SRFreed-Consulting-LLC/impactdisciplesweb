import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Actions, ofActionDispatched, Store } from '@ngxs/store';
import { CourseModel } from 'impactdisciplescommon/src/models/domain/course.model';
import { TrainingRoomModel } from 'impactdisciplescommon/src/models/domain/training-room.model';
import { ShowCourseModal } from '../course-modal/course-modal.actions';
import { CustomerModel } from 'impactdisciplescommon/src/models/domain/utils/customer.model';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { alert, confirm } from 'devextreme/ui/dialog';
import { EventService } from 'impactdisciplescommon/src/services/data/event.service';
import { EventRegistrationModel } from 'impactdisciplescommon/src/models/domain/event-registration.model';
import { CoachModel } from 'impactdisciplescommon/src/models/domain/coach.model';
import { ScheduleModel, TimeGroupsModel } from 'impactdisciplescommon/src/models/utils/schedule.model';
import { ScheduleService } from 'impactdisciplescommon/src/services/utils/schedule.service';
import notify from 'devextreme/ui/notify';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { BreakoutSessionModal } from './breakout-sessions-modal.actions';
import { AgendaItem } from 'impactdisciplescommon/src/models/domain/utils/agenda-item.model';
import { ResetSchedule } from '../schedule.actions';
import { EventRegistrationService } from 'impactdisciplescommon/src/services/data/event-registration.service';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-breakout-sessions',
  templateUrl: './breakout-sessions.component.html',
  styleUrls: ['./breakout-sessions.component.scss']
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

  public isVisible$ = new BehaviorSubject<boolean>(false);
  private ngUnsubscribe = new Subject<void>();

  constructor(private actions$: Actions,
    private store: Store,
    private eventRegistrationService: EventRegistrationService,
    private scheduleService: ScheduleService,
    private eventService: EventService) { }

    async ngOnInit(): Promise<void> {

      this.actions$.pipe(
        ofActionDispatched(BreakoutSessionModal),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(({ allCourses, myCourses, currentUser, event, coursesList, coachesList, roomsList, timeGroup }: BreakoutSessionModal) => {
        this.allCourses = allCourses;
        this.myCourses = myCourses;
        this.currentUser = currentUser;
        this.event = event;
        this.coursesList = coursesList;
        this.coachesList = coachesList;
        this.roomsList = roomsList
        this.selectedTimegroup = timeGroup;
        this.isVisible$.next(true);
      })
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

  getCourseTitle(course:CourseModel){
    if(course && course.title){
      return course.title.replace("Breakout: ", "");
    } else {
      return '';
    }
  }
  getCoachImg(id: string){
    let coach: CoachModel = this.coachesList.find(item => item.id == id);

    if(coach){
      return coach.photoUrl.url
    } else {
      return '';
    }
  }

  getCoachName(id: string){
    let coach: CoachModel = this.coachesList.find(item => item.id == id);

    if(coach){
      return coach.fullname
    } else {
      return '';
    }
  }


  getCoachTitle(id: string){
    let coach: CoachModel = this.coachesList.find(item => item.id == id);

    if(coach){
      return coach.title
    } else {
      return '';
    }
  }

  viewCourse(item: any) {
    if(item.item.isCourse){
      if(this.viewCourseCapcaity(item.item.id) < item.item.maxParticipants){
        let course: CourseModel = this.getCourse(item.item.course);
        this.store.dispatch(new ShowCourseModal(item, course, this.currentUser, this.event, this.allCourses, this.coachesList, this.roomsList));
      } else {
        confirm('<i>This session is currently Full. Would you like to be added to the "Wait List"?</i>', 'Session is Full').then(async (dialogResult) => {
          if (dialogResult) {
            if(!item.item.waitList){
              item.item.waitList = [];
            }

            item.item.waitList.push(this.currentUser.email);

            await this.eventService.getById(this.event.id).then(e => {
              let agendaItemId = e.agendaItems.findIndex(agendaItem=> agendaItem.id == item.item.id);

              e.agendaItems[agendaItemId] = item.item;

              this.event = e;

              alert('<i>You have been successfully added to the waitList</i>', 'Registration Success').then(() => {
                this.store.dispatch(new ResetSchedule());
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
      confirm('<i>You are already assigned to a course at this time. Would you like to remove that course and add the new one?</i>', 'Confirm').then((dialogResult) => {
        if (dialogResult) {
          this.eventRegistrationService
          .unregisterForTrainingSession(this.currentUser.email, conflictingCourse.item.id, this.event.id)
          .then(() => {
            this.eventRegistrationService
              .registerForTrainingSession(this.currentUser.email, course.id, this.event.id)
              .then(() => {
                alert('<i>You have been successfully registered for ' + this.getCourse(course.course).title + "' at " + formatDate(course.startDate, 'shortTime', 'en-US') + '</i>', 'Registration Success').then(() => {
                  this.store.dispatch(new ResetSchedule());
                  this.isVisible$.next(false);
                })
              });
          });
        }
      });
    } else {
      // Directly add the course if no conflict
      this.eventRegistrationService
        .registerForTrainingSession(this.currentUser.email, course.id, this.event.id)
        .then(() => {
          alert('<i>You have been successfully registered for ' + this.getCourse(course.course).title + "' at " + formatDate(course.startDate, 'shortTime', 'en-US') + '</i>', 'Registration Success').then(() => {
            this.store.dispatch(new ResetSchedule());
            this.isVisible$.next(false);
          })
        });
    }
  }

  removeCourse(course: AgendaItem) {
    confirm('<i>Are you sure you want to remove this course from your schedule?</i>', 'Confirm').then((dialogResult) => {
      if (dialogResult) {
        this.eventRegistrationService
        .unregisterForTrainingSession(this.currentUser.email, course.id, this.event.id)
        .then(() => {
          alert('<i>You have been successfully removed from ' + this.getCourse(course.course).title + "' at " + formatDate(course.startDate, 'shortTime', 'en-US') + '</i>', 'Registration Removed').then(() => {
            this.store.dispatch(new ResetSchedule());
            this.isVisible$.next(false);
          })

        });
      }
    });
  }

  onCancel(){
    this.isVisible$.next(false);
  }

  viewCourseCapcaity(item: any) {
    return this.scheduleService.traininlist.get(item)?.length || 0;
  }

resizePopup() {
  var viewportWidth = window.innerWidth;
  var popupWidth = viewportWidth < 768 ? '100%' : '50%';
  return popupWidth
}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
