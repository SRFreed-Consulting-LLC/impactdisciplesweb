import { breakoutTitle, breakoutDescription, sameBreakoutSession } from './breakout.util';
import { AgendaItem } from 'src/app/common/models/domain/utils/agenda-item.model';
import { CourseModel } from 'src/app/common/models/domain/course.model';

// Post-Courses-retirement items are self-contained; pre-flatten items lean
// on their legacy courses/{id} doc. These helpers arbitrate between the two,
// so the specs construct bare object literals for both shapes.
const item = (fields: Partial<AgendaItem>): AgendaItem => fields as AgendaItem;
const course = (fields: Partial<CourseModel>): CourseModel => fields as CourseModel;

describe('breakoutTitle', () => {
  it('prefers the item\'s own text over the legacy course title', () => {
    expect(breakoutTitle(item({ text: 'Discipleship 101' }), course({ title: 'Breakout: Old Name' })))
      .toBe('Discipleship 101');
  });

  it('falls back to the course title when the item has no text', () => {
    expect(breakoutTitle(item({}), course({ title: 'Evangelism Workshop' }))).toBe('Evangelism Workshop');
  });

  it('strips the legacy "Breakout: " prefix from a course-title fallback', () => {
    expect(breakoutTitle(null, course({ title: 'Breakout: Prayer Basics' }))).toBe('Prayer Basics');
  });

  it('treats an empty-string text as absent (falls through to the course)', () => {
    expect(breakoutTitle(item({ text: '' }), course({ title: 'Breakout: Prayer Basics' }))).toBe('Prayer Basics');
  });

  it('returns empty string with neither item text nor a course', () => {
    expect(breakoutTitle(null)).toBe('');
    expect(breakoutTitle(undefined, null)).toBe('');
    expect(breakoutTitle(item({}), course({}))).toBe('');
  });
});

describe('breakoutDescription', () => {
  it('prefers the item\'s own description over any course text', () => {
    const result = breakoutDescription(
      item({ description: 'From the item' }),
      course({ longDescription: 'Long', shortDescription: 'Short' })
    );
    expect(result).toBe('From the item');
  });

  it('falls back to the course longDescription before shortDescription', () => {
    expect(breakoutDescription(item({}), course({ longDescription: 'Long', shortDescription: 'Short' })))
      .toBe('Long');
  });

  it('falls back to shortDescription when there is no longDescription', () => {
    expect(breakoutDescription(item({}), course({ shortDescription: 'Short' }))).toBe('Short');
  });

  it('returns empty string when nothing is populated anywhere', () => {
    expect(breakoutDescription(null)).toBe('');
    expect(breakoutDescription(item({}), course({}))).toBe('');
  });
});

describe('sameBreakoutSession', () => {
  describe('legacy course-id branch (both items pre-flatten)', () => {
    it('matches on the same course id even when the titles differ', () => {
      const a = item({ course: 'course-1', text: 'Morning slot' });
      const b = item({ course: 'course-1', text: 'Afternoon slot' });
      expect(sameBreakoutSession(a, b)).toBeTrue();
    });

    it('does not match different course ids even with identical titles', () => {
      const a = item({ course: 'course-1', text: 'Same Title' });
      const b = item({ course: 'course-2', text: 'Same Title' });
      expect(sameBreakoutSession(a, b)).toBeFalse();
    });
  });

  describe('title branch (at least one item has no legacy course id)', () => {
    it('matches identical titles', () => {
      expect(sameBreakoutSession(item({ text: 'Prayer Basics' }), item({ text: 'Prayer Basics' }))).toBeTrue();
    });

    it('normalizes case and surrounding whitespace before comparing', () => {
      expect(sameBreakoutSession(item({ text: '  Prayer Basics ' }), item({ text: 'prayer basics' }))).toBeTrue();
    });

    it('is used when only ONE side carries a legacy course id', () => {
      // a.course && b.course is false here, so the comparison is by title.
      const a = item({ course: 'course-1', text: 'Prayer Basics' });
      const b = item({ text: 'Prayer Basics' });
      expect(sameBreakoutSession(a, b)).toBeTrue();
    });

    it('never matches two items that both lack a title', () => {
      expect(sameBreakoutSession(item({}), item({}))).toBeFalse();
      expect(sameBreakoutSession(item({ text: '' }), item({ text: '' }))).toBeFalse();
      expect(sameBreakoutSession(item({ text: '   ' }), item({ text: ' ' }))).toBeFalse();
    });

    it('tolerates null/undefined items', () => {
      expect(sameBreakoutSession(null, item({ text: 'Prayer Basics' }))).toBeFalse();
      expect(sameBreakoutSession(undefined, undefined)).toBeFalse();
    });
  });
});
