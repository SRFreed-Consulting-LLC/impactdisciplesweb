import { AgendaItem } from '@impact-common/shared/models/domain/utils/agenda-item.model';

// A breakout agenda item is SELF-CONTAINED: `text` is its title and
// `description` its description.
//
// It was not always. Until the August 2026 Courses retirement a breakout
// pointed at a `courses/{id}` document for both, and these helpers took that
// document as a second argument to fall back on for items authored before
// the flatten backfill.
//
// THE FALLBACKS ARE GONE (2026-09-01), and the `courses` collection with
// them. Counted before removing them, in both environments: 84 agenda items,
// 84 carrying their own text, none needing the lookup.
//
// `AgendaItem.course` still EXISTS on the stored items - 28 of them carry it
// - and is deliberately kept as frozen provenance. sameBreakoutSession below
// still reads it, because that is the item's own field and costs no query.

export function breakoutTitle(item: AgendaItem | null | undefined): string {
  return item?.text ?? '';
}

export function breakoutDescription(item: AgendaItem | null | undefined): string {
  return item?.description ?? '';
}

// "Is this the same session offered at a different time?" - the schedule's
// double-booking check. Same legacy course id when both items carry one
// (28 of them still do), else normalized-title equality (post-retirement
// breakouts are keyed by their typed title; the admin's "copy from existing
// breakout option" keeps recurring titles identical).
//
// The course branch READS NO COLLECTION - `course` is a string on the item -
// so it stays. Dropping it would quietly change which sessions count as the
// same one for every item that still carries an id.
export function sameBreakoutSession(a: AgendaItem | null | undefined, b: AgendaItem | null | undefined): boolean {
  if (a?.course && b?.course) {
    return a.course === b.course;
  }
  const norm = (s?: string) => (s ?? '').trim().toLowerCase();
  return !!norm(a?.text) && norm(a?.text) === norm(b?.text);
}
