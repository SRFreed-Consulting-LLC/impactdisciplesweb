import { CoachModel } from "impactdisciplescommon/src/models/domain/coach.model";
import { CourseModel } from "impactdisciplescommon/src/models/domain/course.model";
import { EventRegistrationModel } from "impactdisciplescommon/src/models/domain/event-registration.model";
import { EventModel } from "impactdisciplescommon/src/models/domain/event.model";
import { TrainingRoomModel } from "impactdisciplescommon/src/models/domain/training-room.model";
import { CustomerModel } from "impactdisciplescommon/src/models/domain/utils/customer.model";
import { ScheduleModel, TimeGroupsModel } from "impactdisciplescommon/src/models/utils/schedule.model";

export class BreakoutSessionModal {
  static readonly type = '[Breakout Sessions MODAL] Show Breakout Sessions Modal';
  constructor(
    public allCourses: ScheduleModel[],
    public myCourses: ScheduleModel[],
    public currentUser: CustomerModel | EventRegistrationModel,
    public event: EventModel,
    public coursesList: CourseModel[],
    public coachesList: CoachModel[],
    public roomsList: TrainingRoomModel[],
    public timeGroup: TimeGroupsModel
  ){}
}
