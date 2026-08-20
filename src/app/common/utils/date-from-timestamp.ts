import { fromUnixTime, isDate, isValid, parse } from 'date-fns';

export const dateFromTimestamp = (item) => {
  if (!item) {
    return null;
  }

  if (isDate(item)) {
    return item;
  }

  if (typeof item === 'string') {
    return parseStringDate(item);
  }

  let normalizedDate;

  if (item?.seconds) {
    normalizedDate = fromUnixTime(item.seconds);
  }

  return isValid(normalizedDate) ? normalizedDate : null;
};

// Single canonical "give me a sortable number" helper - use this instead of
// a per-component `new Date(x).getTime()`. Delegates entirely to
// dateFromTimestamp() above, so it correctly handles a real Date, a date
// string, AND a raw Firestore Timestamp (including the {seconds,
// nanoseconds}-shaped map some documents have instead of a genuine
// Timestamp instance). Components used to hand-roll this themselves, each
// covering a different subset of these shapes (most only handled a Date or
// ISO string, silently sorting a Timestamp to NaN/epoch) - that
// inconsistency is exactly what this consolidates away. Ported verbatim
// from the admin repo's copy of this util (2026-08-20).
export const toMillis = (item: unknown): number => {
  const date = dateFromTimestamp(item);
  if (date instanceof Date) {
    return date.getTime();
  }
  // parseStringDate()'s "MM/dd/yyyy" regex (below) only handles that one
  // literal format - it doesn't match the ISO strings ("2026-01-30T02:00:00")
  // most `events` documents actually store startDate as, so those fall
  // through unparsed. This fallback covers ISO/native-Date-parseable strings
  // and numbers; between the two, every real date shape seen in this app's
  // data is handled.
  if (typeof item === 'string' || typeof item === 'number') {
    const fallback = new Date(item);
    if (!isNaN(fallback.getTime())) {
      return fallback.getTime();
    }
  }
  return 0;
};

const parseStringDate = (dateString: string): null | Date | string => {
  if (!dateString) {
    return null;
  }
  if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const date = parse(dateString, 'MM/dd/yyyy', new Date());
    return isValid(date) ? date : null;
  }
  return dateString;
};
