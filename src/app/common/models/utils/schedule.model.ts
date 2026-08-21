import { AgendaItem } from "@impact-common/shared/models/domain/utils/agenda-item.model";

export class ScheduleModel {
  monthYear: string;
  days: DaysModel[]
}

export class DaysModel {
  date: Date;
  timeGroups: TimeGroupsModel[]
}

export class TimeGroupsModel {
  date: Date;
  items: UpdatedAgendaItemModel[]
}

export class UpdatedAgendaItemModel {
  isAssignedToUser: boolean;
  item: AgendaItem
}