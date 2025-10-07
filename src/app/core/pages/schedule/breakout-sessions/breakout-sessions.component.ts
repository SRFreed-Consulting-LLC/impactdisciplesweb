import { Component, Input } from '@angular/core';
import { Store } from '@ngxs/store';
import { CourseModel } from 'impactdisciplescommon/src/models/domain/course.model';
import { TrainingRoomModel } from 'impactdisciplescommon/src/models/domain/training-room.model';
import { ShowCourseModal } from '../course-modal/course-modal.actions';
import { CustomerModel } from 'impactdisciplescommon/src/models/domain/utils/customer.model';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { confirm } from 'devextreme/ui/dialog';
import { EventService } from 'impactdisciplescommon/src/services/data/event.service';
import { EventRegistrationModel } from 'impactdisciplescommon/src/models/domain/event-registration.model';
import { LocationService } from 'impactdisciplescommon/src/services/data/location.service';
import { CoachModel } from 'impactdisciplescommon/src/models/domain/coach.model';
import { ScheduleModel } from 'impactdisciplescommon/src/models/utils/schedule.model';
import { ScheduleService } from 'impactdisciplescommon/src/services/utils/schedule.service';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-breakout-sessions',
  templateUrl: './breakout-sessions.component.html',
  styleUrls: ['./breakout-sessions.component.scss']
})
export class BreakoutSessionsComponent {
  @Input() allCourses: ScheduleModel[];
  @Input() myCourses: ScheduleModel[];
  @Input() currentUser: CustomerModel | EventRegistrationModel;
  @Input() event: EventModel;
  @Input('courses') coursesList: CourseModel[] = [];
  @Input('coaches') coachesList: CoachModel[] = [];
  @Input('rooms') roomsList: TrainingRoomModel[] = [];

  constructor(private locationService: LocationService,
    private store: Store,
    private scheduleService: ScheduleService,
    private eventService: EventService) { }

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
    if(item.item.isBreakout){
      if(this.viewCourseCapcaity(item.item.id) < item.item.maxParticipants){
        let course: CourseModel = this.getCourse(item.item.course);
        this.store.dispatch(new ShowCourseModal(item, course, this.currentUser, this.event));
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

              this.eventService.update(e.id, e).then(e => {
                notify({
                  message: 'You have been successfully added to the waitList!',
                  position: 'top',
                  type: 'success'
                });
              });
            })

            //add user to wait list
            //pop up a success message
          }
        })
      }
    }
  }

  viewCourseCapcaity(item: any) {
    return this.scheduleService.traininlist.get(item)?.length || 0;
  }
}
