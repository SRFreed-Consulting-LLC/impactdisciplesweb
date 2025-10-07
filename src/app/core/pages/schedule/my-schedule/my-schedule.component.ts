import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CoachModel } from 'impactdisciplescommon/src/models/domain/coach.model';
import { CourseModel } from 'impactdisciplescommon/src/models/domain/course.model';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { TrainingRoomModel } from 'impactdisciplescommon/src/models/domain/training-room.model';
import { AgendaItem } from 'impactdisciplescommon/src/models/domain/utils/agenda-item.model';
import { Store } from '@ngxs/store';
import { ShowCourseModal } from '../course-modal/course-modal.actions';
import { EventRegistrationService } from 'impactdisciplescommon/src/services/data/event-registration.service';
import { CustomerModel } from 'impactdisciplescommon/src/models/domain/utils/customer.model';
import { confirm } from 'devextreme/ui/dialog';
import { EventRegistrationModel } from 'impactdisciplescommon/src/models/domain/event-registration.model';
import { DaysModel, ScheduleModel, TimeGroupsModel } from 'impactdisciplescommon/src/models/utils/schedule.model';

@Component({
  selector: 'app-my-schedule',
  templateUrl: './my-schedule.component.html',
  styleUrls: ['./my-schedule.component.scss']
})
export class MyScheduleComponent {
  @Input('event') event: EventModel;
  @Input() fullSchedule: ScheduleModel[];
  @Input() activeDay: DaysModel;
  @Input() currentUser: CustomerModel | EventRegistrationModel;
  @Input('courses') coursesList: CourseModel[] = [];
  @Input('coaches') coachesList: CoachModel[] = [];
  @Input('rooms') roomsList: TrainingRoomModel[] = [];
  @Output() courseUpdated: EventEmitter<any> = new EventEmitter<any>();
  @Output() navigateToBreakouts: EventEmitter<any> = new EventEmitter<any>();

  selectedAgendaItem: AgendaItem;
  trainingDays: TrainingDay[];

  constructor(
    private store: Store,
    private eventRegistrationService: EventRegistrationService){}

  isUserAssignedToItem(agendaItem: { isAssignedToUser: boolean; item: AgendaItem }): boolean {
    return agendaItem.isAssignedToUser;
  }

  isAnyItemAssignedInGroup(timeGroup: { date: Date; items: { isAssignedToUser: boolean; item: AgendaItem }[] }): boolean {
    return timeGroup.items.some(item => item.isAssignedToUser);
  }

  addCourse(agendaItem: AgendaItem, timeGroup: any) {
    this.eventRegistrationService
      .registerForTrainingSession(this.currentUser.email, agendaItem.id, this.event.id)
      .then(() => {
        this.courseUpdated.emit(timeGroup);
      });
  }

  removeCourse(agendaItem: AgendaItem, timeGroup: any) {
    confirm('<i>Are you sure you want to remove this course from your schedule?</i>', 'Confirm').then((dialogResult) => {
      if (dialogResult) {
        this.eventRegistrationService
          .unregisterForTrainingSession(this.currentUser.email, agendaItem.id, this.event.id)
          .then(() => {
            this.courseUpdated.emit(timeGroup);
          });
      }
    });
  }

  setActiveDay(dayGroup: any) {
    this.activeDay = dayGroup;
  }

  onNavigateToBreakouts(timeGroup: TimeGroupsModel) {
    const isAnyItemAssignedInGroup = this.isAnyItemAssignedInGroup(timeGroup)
    if(isAnyItemAssignedInGroup) {
      const customAgendaItem = timeGroup.items.find(item => item.isAssignedToUser);
      if (customAgendaItem) {
        let course: CourseModel = this.coursesList.find(item => item.id == customAgendaItem.item.course);

        this.store.dispatch(new ShowCourseModal(customAgendaItem, course, this.currentUser, this.event));
      }
    } else {
      this.navigateToBreakouts.emit();
    }
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

  getCoachName(id: string){
    let coach: CoachModel = this.coachesList.find(item => item.id == id);

    if(coach){
      return coach.fullname
    } else {
      return '';
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

  viewCourse(item: any) {
    let course: CourseModel = this.coursesList.find(course => course.id == item.item.course);
    this.store.dispatch(new ShowCourseModal(item, course, this.currentUser, this.event));
  }

}

export class TrainingDay{
  date: Date;
  sessions: TrainingSession[] = [];

}

export class TrainingSession{
  date: Date;
  startTime: Date;
  endTime: Date;
  title: string;
  description: string;
  courses: AgendaItem[] = [];
}
