import { pad2, remainingUntil } from './countdown.util';

describe('remainingUntil', () => {
  const NOW = Date.parse('2026-09-05T12:00:00Z');

  it('splits the time left into days, hours, minutes and seconds', () => {
    expect(remainingUntil('2026-09-07T13:01:02Z', NOW)).toEqual({
      days: 2, hours: 1, minutes: 1, seconds: 2
    });
  });

  it('draws nothing for a missing, unparseable or past date', () => {
    expect(remainingUntil(undefined, NOW)).toBeNull();
    expect(remainingUntil('soon', NOW)).toBeNull();
    expect(remainingUntil('2026-09-05T11:59:59Z', NOW)).toBeNull();
    // Exactly now is "started", not "one second to go".
    expect(remainingUntil('2026-09-05T12:00:00Z', NOW)).toBeNull();
  });

  it('pads to two digits', () => {
    expect(pad2(7)).toBe('07');
    expect(pad2(42)).toBe('42');
  });
});
