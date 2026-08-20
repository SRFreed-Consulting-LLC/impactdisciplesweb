import { TimeFormatPipe } from './time-format.pipe';

// Pure PipeTransform over the "HH:mm" strings agenda items store -- no
// Angular test harness needed, `new TimeFormatPipe()` is the whole setup.
describe('TimeFormatPipe', () => {
  let pipe: TimeFormatPipe;

  beforeEach(() => {
    pipe = new TimeFormatPipe();
  });

  it('formats an afternoon time into 12-hour with PM', () => {
    expect(pipe.transform('13:05')).toBe('1:05 PM');
  });

  it('formats a morning time with AM and no leading zero on the hour', () => {
    expect(pipe.transform('09:30')).toBe('9:30 AM');
  });

  it('zero-pads single-digit minutes', () => {
    expect(pipe.transform('14:07')).toBe('2:07 PM');
  });

  it('renders midnight as 12 AM', () => {
    expect(pipe.transform('00:00')).toBe('12:00 AM');
  });

  it('renders noon as 12 PM', () => {
    expect(pipe.transform('12:00')).toBe('12:00 PM');
  });

  it('renders the last minute of the day as 11:59 PM', () => {
    expect(pipe.transform('23:59')).toBe('11:59 PM');
  });

  it('omits the AM/PM suffix when showAmPm is false', () => {
    expect(pipe.transform('13:05', false)).toBe('1:05');
    expect(pipe.transform('09:30', false)).toBe('9:30');
  });

  it('ignores a seconds component ("HH:mm:ss" input)', () => {
    expect(pipe.transform('14:30:00')).toBe('2:30 PM');
  });

  it('returns empty string for empty/absent input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null as unknown as string)).toBe('');
    expect(pipe.transform(undefined as unknown as string)).toBe('');
  });
});
