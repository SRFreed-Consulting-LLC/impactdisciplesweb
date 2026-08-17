import { EventRegistrationService } from 'src/app/common/services/data/event-registration.service';
import { Injectable } from "@angular/core";
import { AgendaItem } from "src/app/common/models/domain/utils/agenda-item.model";
import { EventModel } from 'src/app/common/models/domain/event.model';
import { ScheduleModel, TimeGroupsModel, UpdatedAgendaItemModel } from 'src/app/common/models/utils/schedule.model';

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  public fullSchedule: ScheduleModel[] = [];
  public myCourses: ScheduleModel[] = [];
  public allCourses: ScheduleModel[] = [];
  public mySchedule: ScheduleModel[] = [];
  public sessionIds: string[] = [];

  constructor(private eventRegistrationService: EventRegistrationService){}

  public organizeAgendaItems(agendaItems: AgendaItem[]): void {
    const sortedItems = [...agendaItems].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const groupedAgendaItems = this.groupByDateAndTime(sortedItems);

    // Create fullSchedule
    this.fullSchedule = groupedAgendaItems.map((group) => ({
      monthYear: group.monthYear,
      days: group.days.map((day) => ({
        date: day.date,
        timeGroups: this.groupItemsByTime(day.items),
      })),
    }));

    // Create myCourses based on sessionIds
    this.myCourses = this.fullSchedule.map((group) => ({
      monthYear: group.monthYear,
      days: group.days.map((day) => ({
        date: day.date,
        timeGroups: day.timeGroups.map((timeGroup) => ({
          date: timeGroup.date,
          items: timeGroup.items.filter((agendaItem) => this.sessionIds?.includes(agendaItem.item.id)),
        })).filter((timeGroup) => timeGroup.items.length > 0), // Remove empty timeGroups
      })).filter((day) => day.timeGroups.length > 0), // Remove empty days
    })).filter((group) => group.days.length > 0);

    // Create allCourses based on items with isCourse
    this.allCourses = this.fullSchedule.map((group) => ({
      monthYear: group.monthYear,
      days: group.days.map((day) => ({
        date: day.date,
        timeGroups: day.timeGroups.map((timeGroup) => ({
          date: timeGroup.date,
          items: timeGroup.items.filter((agendaItem) => agendaItem.item.isCourse),
        })).filter((timeGroup) => timeGroup.items.length > 0), // Remove empty timeGroups
      })).filter((day) => day.timeGroups.length > 0), // Remove empty days
    })).filter((group) => group.days.length > 0);

    // Mark isAssignedToUser in fullSchedule
    this.markAssignedItems();

    // Create mySchedule with specific filtering criteria
    this.mySchedule = this.fullSchedule.map((group) => ({
      monthYear: group.monthYear,
      days: group.days.map((day) => ({
        date: day.date,
        timeGroups: day.timeGroups.map((timeGroup) => ({
          date: timeGroup.date,
          items: timeGroup.items.filter(
            (agendaItem) => !(agendaItem.item.isCourse && !agendaItem.isAssignedToUser)
          ),
        })).filter((timeGroup) => timeGroup.items.length > 0),
      })).filter((day) => day.timeGroups.length > 0),
    })).filter((group) => group.days.length > 0);
  }

  private groupByDateAndTime(items: AgendaItem[]): { monthYear: string; days: { date: Date; items: AgendaItem[] }[] }[] {
    const groupedByMonthYear = items.reduce((acc, item) => {
      const monthYear = new Date(item.startDate).toLocaleString('default', { month: 'long', year: 'numeric' });
      const date = new Date(item.startDate).toDateString();
      acc[monthYear] = acc[monthYear] || {};
      acc[monthYear][date] = acc[monthYear][date] || [];
      acc[monthYear][date].push(item);
      return acc;
    }, {});

    return Object.entries(groupedByMonthYear).map(([monthYear, days]) => ({
      monthYear,
      days: Object.entries(days)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, items]) => ({ date: new Date(date), items })),
    }));
  }

  private groupItemsByTime(items: AgendaItem[]): TimeGroupsModel[] {
    const groupedByDate = items.reduce((acc, item) => {
      const dateKey = new Date(item.startDate).toISOString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      // Initialize isAssignedToUser as false
      acc[dateKey].push({ isAssignedToUser: false, item });
      return acc;
    }, {} as Record<string, UpdatedAgendaItemModel[]>);

    return Object.keys(groupedByDate).map((dateKey) => ({
      date: new Date(dateKey),
      items: groupedByDate[dateKey],
    }));
  }

  private markAssignedItems(): void {
    // Iterate through fullSchedule and compare items with myCourses
    this.fullSchedule.forEach((group) => {
      group.days.forEach((day) => {
        day.timeGroups.forEach((timeGroup) => {
          timeGroup.items.forEach((item) => {
            // Check if the item exists in myCourses
            const isAssigned = this.myCourses.some((myGroup) =>
              myGroup.days.some((myDay) =>
                myDay.timeGroups.some((myTimeGroup) =>
                  myTimeGroup.items.some((myItem) => myItem.item.id === item.item.id)
                )
              )
            );
            item.isAssignedToUser = isAssigned; // Mark the item as assigned if a match is found
          });
        });
      });
    });
  }


  // This is a providedIn:'root' singleton and monitorBreakoutCapacity() is
  // Pre-prod #2: capacity comes from the get_session_counts Cloud Function
  // (per-session COUNTS - the full roster stream this replaced exposed
  // every attendee's name/email to any visitor). One-shot fetch instead of
  // a live listener: the schedule refreshes it on load and after every
  // register/unregister action (see SchedulePage.updateSchedule), which is
  // when counts can change from this user's perspective.
  traininlist: Map<string, number> = new Map<string, number>();

  monitorBreakoutCapacity(event: EventModel){
    void this.refreshBreakoutCapacity(event);
  }

  async refreshBreakoutCapacity(event: EventModel): Promise<void> {
    try {
      const counts = await this.eventRegistrationService.getSessionCounts(event.id);
      this.traininlist = new Map(Object.entries(counts));
    } catch {
      // Capacity display is best-effort - a failed refresh keeps the last
      // known counts rather than erroring the schedule.
    }
  }

  stopMonitoringBreakoutCapacity(){
    // One-shot fetches now - nothing to tear down; kept so the page's
    // ngOnDestroy call sites don't churn.
  }
}
