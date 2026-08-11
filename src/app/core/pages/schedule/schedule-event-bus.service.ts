import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CoachModel } from 'src/app/common/models/domain/coach.model';
import { CourseModel } from 'src/app/common/models/domain/course.model';
import { EventRegistrationModel } from 'src/app/common/models/domain/event-registration.model';
import { EventModel } from 'src/app/common/models/domain/event.model';
import { TrainingRoomModel } from 'src/app/common/models/domain/training-room.model';
import { CustomerModel } from 'src/app/common/models/domain/utils/customer.model';
import { ScheduleModel, TimeGroupsModel, UpdatedAgendaItemModel } from 'src/app/common/models/utils/schedule.model';

export interface ShowCourseModalPayload {
  customAgendaItem: UpdatedAgendaItemModel;
  course: CourseModel;
  currentUser: CustomerModel | EventRegistrationModel;
  event: EventModel;
  allCourses: ScheduleModel[];
  coachesList: CoachModel[];
  roomsList: TrainingRoomModel[];
}

export interface BreakoutSessionModalPayload {
  allCourses: ScheduleModel[];
  myCourses: ScheduleModel[];
  currentUser: CustomerModel | EventRegistrationModel;
  event: EventModel;
  coursesList: CourseModel[];
  coachesList: CoachModel[];
  roomsList: TrainingRoomModel[];
  timeGroup: TimeGroupsModel;
}

/**
 * Replaces NgXs for the schedule feature. NgXs was installed and
 * bootstrapped app-wide (NgxsModule.forRoot([], ...)) but only ever used
 * as a typed pub/sub bus between these 3 schedule components -- no
 * @State classes exist anywhere in the app. A plain RxJS service gives
 * the same typed dispatch/listen pattern without the dependency.
 */
@Injectable({
  providedIn: 'root'
})
export class ScheduleEventBusService {
  private resetSchedule$ = new Subject<void>();
  private showCourseModal$ = new Subject<ShowCourseModalPayload>();
  private showBreakoutSessionsModal$ = new Subject<BreakoutSessionModalPayload>();

  readonly resetSchedule = this.resetSchedule$.asObservable();
  readonly showCourseModal = this.showCourseModal$.asObservable();
  readonly showBreakoutSessionsModal = this.showBreakoutSessionsModal$.asObservable();

  dispatchResetSchedule(): void {
    this.resetSchedule$.next();
  }

  dispatchShowCourseModal(payload: ShowCourseModalPayload): void {
    this.showCourseModal$.next(payload);
  }

  dispatchShowBreakoutSessionsModal(payload: BreakoutSessionModalPayload): void {
    this.showBreakoutSessionsModal$.next(payload);
  }
}
