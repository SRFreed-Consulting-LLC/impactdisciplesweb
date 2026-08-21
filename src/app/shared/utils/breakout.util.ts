import { AgendaItem } from '@impact-common/shared/models/domain/utils/agenda-item.model';
import { CourseModel } from '@impact-common/shared/models/domain/course.model';

// 2026-08 Courses retirement: a breakout agenda item is self-contained now
// (`text` = title, `description` = description). These helpers read the
// item first and fall back to its legacy courses/{id} doc for anything
// authored before the flatten - the fallbacks (and the CourseModel type)
// go away once every live event's items carry their own text.

export function breakoutTitle(item: AgendaItem | null | undefined, course?: CourseModel | null): string {
  if (item?.text) {
    return item.text;
  }
  // Old course titles were stored with a "Breakout: " prefix the site
  // always stripped at display time.
  return (course?.title ?? '').replace('Breakout: ', '');
}

export function breakoutDescription(item: AgendaItem | null | undefined, course?: CourseModel | null): string {
  return item?.description || course?.longDescription || course?.shortDescription || '';
}

// "Is this the same session offered at a different time?" - the schedule's
// double-booking check. Same legacy course id when both items carry one
// (pre-flatten data), else normalized-title equality (post-retirement
// breakouts are keyed by their typed title; the admin's "copy from existing
// breakout option" keeps recurring titles identical).
export function sameBreakoutSession(a: AgendaItem | null | undefined, b: AgendaItem | null | undefined): boolean {
  if (a?.course && b?.course) {
    return a.course === b.course;
  }
  const norm = (s?: string) => (s ?? '').trim().toLowerCase();
  return !!norm(a?.text) && norm(a?.text) === norm(b?.text);
}
