import { Timestamp } from 'firebase/firestore';
import { dateFromTimestamp, toMillis } from './date-from-timestamp';

// Normalizes the several shapes a "date" arrives in from Firestore (see the
// admin repo's MIGRATION.md on inconsistent date-field shapes): a real
// Timestamp, a malformed plain {seconds, nanoseconds} map, a string, or an
// already-parsed Date. Timestamp is constructible without a Firebase app.
describe('dateFromTimestamp', () => {
  it('converts a real Firestore Timestamp via its seconds field', () => {
    const seconds = 1723680000; // 2024-08-15T00:00:00Z
    const result = dateFromTimestamp(new Timestamp(seconds, 0)) as Date;

    expect(result instanceof Date).toBeTrue();
    expect(result.getTime()).toBe(seconds * 1000);
  });

  it('converts a malformed plain {seconds, nanoseconds} map the same way', () => {
    const seconds = 1723680000;
    const result = dateFromTimestamp({ seconds, nanoseconds: 123 }) as Date;

    expect(result instanceof Date).toBeTrue();
    expect(result.getTime()).toBe(seconds * 1000);
  });

  it('returns a Date input as-is (same reference)', () => {
    const date = new Date(2024, 7, 15);
    expect(dateFromTimestamp(date)).toBe(date);
  });

  it('parses an MM/dd/yyyy string into a Date', () => {
    const result = dateFromTimestamp('08/15/2024') as Date;

    expect(result instanceof Date).toBeTrue();
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(7);
    expect(result.getDate()).toBe(15);
  });

  it('returns null for an MM/dd/yyyy-shaped string that is not a real date', () => {
    expect(dateFromTimestamp('13/45/2024')).toBeNull();
  });

  it('passes any other string (e.g. ISO) through unchanged rather than parsing it', () => {
    expect(dateFromTimestamp('2024-08-15T00:00:00.000Z')).toBe('2024-08-15T00:00:00.000Z');
    expect(dateFromTimestamp('not a date')).toBe('not a date');
  });

  it('returns null for empty/absent input', () => {
    expect(dateFromTimestamp(null)).toBeNull();
    expect(dateFromTimestamp(undefined)).toBeNull();
    expect(dateFromTimestamp('')).toBeNull();
    expect(dateFromTimestamp(0)).toBeNull();
  });

  it('returns null for garbage that matches no supported shape', () => {
    expect(dateFromTimestamp({})).toBeNull();
    expect(dateFromTimestamp({ foo: 'bar' })).toBeNull();
    expect(dateFromTimestamp(12345)).toBeNull();
    expect(dateFromTimestamp({ seconds: 'not-a-number' })).toBeNull();
  });

  it('documents the epoch edge: seconds === 0 is treated as absent and returns null', () => {
    // `item?.seconds` is falsy for 0, so a Timestamp at exactly the Unix
    // epoch normalizes to null. Real data never stores the epoch on
    // purpose; this pins the current behavior rather than blessing it.
    expect(dateFromTimestamp(new Timestamp(0, 0))).toBeNull();
    expect(dateFromTimestamp({ seconds: 0, nanoseconds: 0 })).toBeNull();
  });

  describe('toMillis', () => {
    const seconds = 1723680000; // 2024-08-15T00:00:00Z

    it('returns epoch millis for a Date, a Timestamp, and a {seconds} map alike', () => {
      expect(toMillis(new Date(seconds * 1000))).toBe(seconds * 1000);
      expect(toMillis(new Timestamp(seconds, 0))).toBe(seconds * 1000);
      expect(toMillis({ seconds, nanoseconds: 5 })).toBe(seconds * 1000);
    });

    it('parses the MM/dd/yyyy form via dateFromTimestamp and ISO strings via the native fallback', () => {
      expect(toMillis('08/15/2024')).toBe(new Date(2024, 7, 15).getTime());
      expect(toMillis('2024-08-15T00:00:00Z')).toBe(seconds * 1000);
    });

    it('returns 0 (not NaN) for null, undefined, and unparsable input so sorts stay stable', () => {
      expect(toMillis(null)).toBe(0);
      expect(toMillis(undefined)).toBe(0);
      expect(toMillis('not a date')).toBe(0);
      expect(toMillis({})).toBe(0);
    });
  });
});
