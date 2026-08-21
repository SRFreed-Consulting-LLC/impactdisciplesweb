import { AgendaItem } from '@impact-common/shared/models/domain/utils/agenda-item.model';
import { EventModel } from '@impact-common/shared/models/domain/event.model';
import { EventRegistrationService } from 'src/app/common/services/data/event-registration.service';
import { ScheduleService } from './schedule.service';

// ScheduleService turns a flat agendaItems array into the four views the
// summit schedule page renders (fullSchedule / allCourses / myCourses /
// mySchedule), grouped month -> day -> time slot. It is the most algorithmic
// code in the web app and had no spec; its only dependency is
// EventRegistrationService (one method, for capacity counts), so a duck-typed
// stub is the whole setup.
//
// Times below are LOCAL (`new Date(y, m, d, h)`) on purpose: the grouping
// keys come from toLocaleString/toDateString/toISOString on the parsed date,
// so building fixtures from local components keeps the day boundaries the
// test asserts on stable wherever it runs.

function item(overrides: Partial<AgendaItem> = {}): AgendaItem {
  return {
    id: 'a1',
    text: 'Session',
    startDate: new Date(2027, 7, 24, 9, 0),
    endDate: new Date(2027, 7, 24, 10, 0),
    ...overrides
  } as unknown as AgendaItem;
}

function makeService(counts: Record<string, number> = {}): {
  service: ScheduleService;
  calls: () => number;
  fail: (shouldFail: boolean) => void;
} {
  let calls = 0;
  let shouldFail = false;
  const registrations = {
    getSessionCounts: (eventId: string) => {
      calls += 1;
      expect(eventId).toBe('event-1');
      return shouldFail ? Promise.reject(new Error('offline')) : Promise.resolve(counts);
    }
  } as unknown as EventRegistrationService;

  return {
    service: new ScheduleService(registrations),
    calls: () => calls,
    fail: (value: boolean) => { shouldFail = value; }
  };
}

describe('ScheduleService', () => {
  describe('organizeAgendaItems', () => {
    it('groups by month, then day, then start time - in chronological order', () => {
      const { service } = makeService();
      // Deliberately out of order, spanning two days and two months.
      service.organizeAgendaItems([
        item({ id: 'sep', startDate: new Date(2027, 8, 1, 9) }),
        item({ id: 'aug25-late', startDate: new Date(2027, 7, 25, 14) }),
        item({ id: 'aug24-early', startDate: new Date(2027, 7, 24, 9) }),
        item({ id: 'aug24-late', startDate: new Date(2027, 7, 24, 13) })
      ]);

      const [august, september] = service.fullSchedule;
      expect(august.monthYear).toBe('August 2027');
      expect(september.monthYear).toBe('September 2027');

      expect(august.days.length).toBe(2);
      expect(august.days[0].date.getDate()).toBe(24);
      expect(august.days[1].date.getDate()).toBe(25);

      // Two distinct start times on the 24th -> two time groups, in order.
      expect(august.days[0].timeGroups.map(g => g.items[0].item.id))
        .toEqual(['aug24-early', 'aug24-late']);
    });

    it('puts items that share a start time in the same time group', () => {
      const { service } = makeService();
      const start = new Date(2027, 7, 24, 9);
      service.organizeAgendaItems([
        item({ id: 'breakout-a', startDate: start }),
        item({ id: 'breakout-b', startDate: new Date(start) })
      ]);

      const timeGroups = service.fullSchedule[0].days[0].timeGroups;
      expect(timeGroups.length).toBe(1);
      expect(timeGroups[0].items.map(i => i.item.id)).toEqual(['breakout-a', 'breakout-b']);
    });

    it('allCourses keeps only isCourse items and drops emptied groups', () => {
      const { service } = makeService();
      service.organizeAgendaItems([
        item({ id: 'keynote', startDate: new Date(2027, 7, 24, 9) }),
        item({ id: 'breakout', startDate: new Date(2027, 7, 24, 11), isCourse: true }),
        item({ id: 'plenary', startDate: new Date(2027, 7, 25, 9) })
      ]);

      const courseIds = service.allCourses
        .flatMap(g => g.days)
        .flatMap(d => d.timeGroups)
        .flatMap(t => t.items)
        .map(i => i.item.id);
      expect(courseIds).toEqual(['breakout']);
      // The 25th had no course at all, so that whole day is gone.
      expect(service.allCourses[0].days.length).toBe(1);
      // ...while fullSchedule still has both days.
      expect(service.fullSchedule[0].days.length).toBe(2);
    });

    it('myCourses keeps only the sessions in sessionIds', () => {
      const { service } = makeService();
      service.sessionIds = ['mine'];
      service.organizeAgendaItems([
        item({ id: 'mine', startDate: new Date(2027, 7, 24, 9), isCourse: true }),
        item({ id: 'theirs', startDate: new Date(2027, 7, 24, 11), isCourse: true })
      ]);

      const mine = service.myCourses
        .flatMap(g => g.days)
        .flatMap(d => d.timeGroups)
        .flatMap(t => t.items)
        .map(i => i.item.id);
      expect(mine).toEqual(['mine']);
    });

    it('marks isAssignedToUser on the full schedule from sessionIds', () => {
      const { service } = makeService();
      service.sessionIds = ['mine'];
      service.organizeAgendaItems([
        item({ id: 'mine', startDate: new Date(2027, 7, 24, 9), isCourse: true }),
        item({ id: 'theirs', startDate: new Date(2027, 7, 24, 11), isCourse: true })
      ]);

      const flags = service.fullSchedule
        .flatMap(g => g.days)
        .flatMap(d => d.timeGroups)
        .flatMap(t => t.items)
        .map(i => [i.item.id, i.isAssignedToUser] as const);
      expect(flags).toEqual([['mine', true], ['theirs', false]]);
    });

    it('mySchedule keeps non-course items plus only the courses I am in', () => {
      const { service } = makeService();
      service.sessionIds = ['mine'];
      service.organizeAgendaItems([
        item({ id: 'keynote', startDate: new Date(2027, 7, 24, 8) }),
        item({ id: 'mine', startDate: new Date(2027, 7, 24, 9), isCourse: true }),
        item({ id: 'theirs', startDate: new Date(2027, 7, 24, 11), isCourse: true })
      ]);

      const ids = service.mySchedule
        .flatMap(g => g.days)
        .flatMap(d => d.timeGroups)
        .flatMap(t => t.items)
        .map(i => i.item.id);
      expect(ids).toEqual(['keynote', 'mine']);
    });

    it('does not mutate the caller\'s array and handles an empty agenda', () => {
      const { service } = makeService();
      const items = [
        item({ id: 'second', startDate: new Date(2027, 7, 24, 11) }),
        item({ id: 'first', startDate: new Date(2027, 7, 24, 9) })
      ];
      service.organizeAgendaItems(items);
      expect(items.map(i => i.id)).toEqual(['second', 'first']);

      service.organizeAgendaItems([]);
      expect(service.fullSchedule).toEqual([]);
      expect(service.allCourses).toEqual([]);
      expect(service.mySchedule).toEqual([]);
    });

    it('re-running replaces the previous schedule rather than appending', () => {
      const { service } = makeService();
      service.organizeAgendaItems([item({ id: 'one' })]);
      service.organizeAgendaItems([item({ id: 'two' })]);

      const ids = service.fullSchedule
        .flatMap(g => g.days)
        .flatMap(d => d.timeGroups)
        .flatMap(t => t.items)
        .map(i => i.item.id);
      expect(ids).toEqual(['two']);
    });
  });

  describe('breakout capacity', () => {
    const event = { id: 'event-1' } as EventModel;

    it('loads per-session counts into the lookup map', async () => {
      const { service } = makeService({ 'session-1': 3, 'session-2': 12 });
      await service.refreshBreakoutCapacity(event);

      expect(service.traininlist.get('session-1')).toBe(3);
      expect(service.traininlist.get('session-2')).toBe(12);
      expect(service.traininlist.get('unknown')).toBeUndefined();
    });

    it('keeps the last known counts when a refresh fails', async () => {
      const { service, fail } = makeService({ 'session-1': 3 });
      await service.refreshBreakoutCapacity(event);

      fail(true);
      await service.refreshBreakoutCapacity(event); // must not throw

      expect(service.traininlist.get('session-1')).toBe(3);
    });

    it('monitorBreakoutCapacity fetches once and stop is a no-op', async () => {
      const { service, calls } = makeService({});
      service.monitorBreakoutCapacity(event);
      await Promise.resolve();
      await Promise.resolve();

      expect(calls()).toBe(1);
      expect(() => service.stopMonitoringBreakoutCapacity()).not.toThrow();
    });
  });
});
