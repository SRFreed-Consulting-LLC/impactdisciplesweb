import { breakoutTitle, breakoutDescription, sameBreakoutSession } from './breakout.util';
import { AgendaItem } from '@impact-common/shared/models/domain/utils/agenda-item.model';

// A breakout item is SELF-CONTAINED. It used to be able to lean on a
// legacy courses/{id} document for its title and description, and half the
// tests here arbitrated between the two shapes - those went with the
// fallbacks and the collection on 2026-09-01, verified first against the
// real data: 84 agenda items, 84 carrying their own text, none needing the
// lookup.
//
// sameBreakoutSession KEPT its course-id branch, and so did its tests: 28
// stored items still carry `course`, and reading that field costs no query.
const item = (fields: Partial<AgendaItem>): AgendaItem => fields as AgendaItem;

describe('breakoutTitle', () => {
  it('returns the item\'s own text', () => {
    expect(breakoutTitle(item({ text: 'Discipleship 101' }))).toBe('Discipleship 101');
  });

  it('returns empty string for an item with no text, and for no item at all', () => {
    expect(breakoutTitle(item({}))).toBe('');
    expect(breakoutTitle(item({ text: '' }))).toBe('');
    expect(breakoutTitle(null)).toBe('');
    expect(breakoutTitle(undefined)).toBe('');
  });
});

describe('breakoutDescription', () => {
  it('returns the item\'s own description', () => {
    expect(breakoutDescription(item({ description: 'From the item' }))).toBe('From the item');
  });

  it('returns empty string when there is none', () => {
    expect(breakoutDescription(item({}))).toBe('');
    expect(breakoutDescription(null)).toBe('');
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
