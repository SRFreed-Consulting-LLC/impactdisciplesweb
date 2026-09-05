/** Days/hours/minutes/seconds left until a moment. */
export interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * What a countdown section shows, or null when there is nothing to count to.
 *
 * NOTHING IS DRAWN when the date is missing, unparseable, or already past.
 * A row of zeros reads as "it starts now" and a negative count reads as a
 * bug; both are worse than the band simply not carrying a clock. The
 * heading and button still render, so a section whose date has gone by
 * degrades into an ordinary banner rather than disappearing.
 *
 * Pure so the rule is testable without the kit section's timer (extracted
 * 2026-09-05, review item 11).
 */
export function remainingUntil(targetIso: string | undefined, now = Date.now()): Remaining | null {
  const target = Date.parse(targetIso ?? '');
  if (!Number.isFinite(target)) {
    return null;
  }
  const left = target - now;
  if (left <= 0) {
    return null;
  }
  const seconds = Math.floor(left / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60
  };
}

/** Two digits, so a clock does not jitter as numbers change width. */
export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
