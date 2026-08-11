import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CourseModel } from 'src/app/common/models/domain/course.model';
import { AgendaItem } from 'src/app/common/models/domain/utils/agenda-item.model';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { TrainingRoomModel } from 'src/app/common/models/domain/training-room.model';
import { CoachModel } from 'src/app/common/models/domain/coach.model';
import { EventRegistrationService } from 'src/app/common/services/data/event-registration.service';
import { CustomerModel } from 'src/app/common/models/domain/utils/customer.model';
import { EventModel } from 'src/app/common/models/domain/event.model';
import { DialogService } from 'src/app/shared/utils/services/dialog.service';
import { EventRegistrationModel } from 'src/app/common/models/domain/event-registration.model';
import { ScheduleModel } from 'src/app/common/models/utils/schedule.model';
import { ScheduleService } from 'src/app/common/services/utils/schedule.service';
import { ScheduleEventBusService } from '../schedule-event-bus.service';

export interface CourseItem {
  course: CourseModel;
  agendaItem: AgendaItem;
}

@Component({
    selector: 'app-course-modal',
    templateUrl: './course-modal.component.html',
    styleUrls: ['./course-modal.component.scss'],
    standalone: false
})
export class CourseModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input() allCourses: ScheduleModel[];
  @Input('event') event: EventModel;
  @Input('courses') coursesList: CourseModel[] = [];
  @Input('coaches') coachesList: CoachModel[] = [];
  @Input('rooms') roomsList: TrainingRoomModel[] = [];
  customAgendaItem: any;
  courseItem: CourseModel;
  currentUser: CustomerModel | EventRegistrationModel;
  @Output() courseUpdated: EventEmitter<any> = new EventEmitter<any>();

  // Looked up by id from the template on every change-detection cycle --
  // Maps give O(1) lookups instead of re-scanning the full list with
  // .find() each time. Rebuilt in ngOnChanges (covers @Input updates) and
  // again after the showCourseModal subscribe below (covers the
  // programmatic reassignment of coachesList/roomsList there).
  private coachesMap = new Map<string, CoachModel>();
  private roomsMap = new Map<string, TrainingRoomModel>();

  public isVisible$ = new BehaviorSubject<boolean>(false);

  private ngUnsubscribe = new Subject<void>();

  constructor(
    private scheduleEventBus: ScheduleEventBusService,
    private eventRegistrationService: EventRegistrationService,
    private scheduleService: ScheduleService,
    private dialogService: DialogService){}

  async ngOnInit(): Promise<void> {
    this.scheduleEventBus.showCourseModal.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(({ customAgendaItem, course, currentUser, event, allCourses, coachesList, roomsList }) => {
      this.customAgendaItem = customAgendaItem;
      this.courseItem = course;
      this.currentUser = currentUser;
      this.event = event;
      this.allCourses = allCourses;
      this.coachesList = coachesList;
      this.roomsList = roomsList;
      this.rebuildLookupMaps();
      this.isVisible$.next(true);
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['coachesList'] || changes['roomsList']) {
      this.rebuildLookupMaps();
    }
  }

  private rebuildLookupMaps(): void {
    this.coachesMap = new Map((this.coachesList || []).map(coach => [coach.id, coach]));
    this.roomsMap = new Map((this.roomsList || []).map(room => [room.id, room]));
  }

  getCapacity(){
    return this.scheduleService.traininlist.get(this?.customAgendaItem?.item.id)?.length;
  }

  getRoomName(id: string){
    return this.roomsMap.get(id)?.name || '';
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
        new Date(item.item.startDate).getTime() === new Date(course.startDate).getTime() &&
        item.item.course !== course.course
      );

    if (conflictingCourse) {
      this.dialogService.confirm('<i>You are already assigned to a course at this time. Would you like to remove that course and add the new one?</i>', 'Confirm').then((dialogResult) => {
        if (dialogResult) {
          this.eventRegistrationService
          .unregisterForTrainingSession(this.currentUser.email, conflictingCourse.item.id, this.event.id)
          .then(() => {
            this.eventRegistrationService
              .registerForTrainingSession(this.currentUser.email, course.id, this.event.id)
              .then(() => {
                this.scheduleEventBus.dispatchResetSchedule();
                this.isVisible$.next(false);
              });
          });
        }
      });
    } else {
      // Directly add the course if no conflict
      this.eventRegistrationService
        .registerForTrainingSession(this.currentUser.email, course.id, this.event.id)
        .then(() => {
          this.scheduleEventBus.dispatchResetSchedule();
          this.isVisible$.next(false);
        });
    }
  }

  removeCourse(course: AgendaItem) {
    this.dialogService.confirm('<i>Are you sure you want to remove this course from your schedule?</i>', 'Confirm').then((dialogResult) => {
      if (dialogResult) {
        this.eventRegistrationService
        .unregisterForTrainingSession(this.currentUser.email, course.id, this.event.id)
        .then(() => {
          this.scheduleEventBus.dispatchResetSchedule();
          this.isVisible$.next(false)
        });
      }
    });
  }

  onCancel(){
    this.isVisible$.next(false);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
