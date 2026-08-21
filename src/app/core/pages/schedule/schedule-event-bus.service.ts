import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CoachModel } from '@impact-common/shared/models/domain/coach.model';
import { CourseModel } from '@impact-common/shared/models/domain/course.model';
import { EventRegistrationModel } from '@impact-common/shared/models/domain/event-registration.model';
import { EventModel } from '@impact-common/shared/models/domain/event.model';
import { TrainingRoomModel } from '@impact-common/shared/models/domain/training-room.model';
import { CustomerModel } from 'src/app/common/models/domain/utils/customer.model';
import { ScheduleModel, TimeGroupsModel } from 'src/app/common/models/utils/schedule.model';

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
 * as a typed pub/sub bus between the schedule components -- no @State
 * classes exist anywhere in the app. A plain RxJS service gives the same
 * typed dispatch/listen pattern without the dependency.
 *
 * (The former showCourseModal channel went with CourseModalComponent in
 * the 2026-08-20 sweep: the breakout-sessions modal renders every session
 * with its own Sign up / Remove controls inline, so the per-course modal
 * had no template mounting it and the dispatch went nowhere.)
 */
@Injectable({
  providedIn: 'root'
})
export class ScheduleEventBusService {
  private resetSchedule$ = new Subject<void>();
  private showBreakoutSessionsModal$ = new Subject<BreakoutSessionModalPayload>();

  readonly resetSchedule = this.resetSchedule$.asObservable();
  readonly showBreakoutSessionsModal = this.showBreakoutSessionsModal$.asObservable();

  dispatchResetSchedule(): void {
    this.resetSchedule$.next();
  }

  dispatchShowBreakoutSessionsModal(payload: BreakoutSessionModalPayload): void {
    this.showBreakoutSessionsModal$.next(payload);
  }
}
