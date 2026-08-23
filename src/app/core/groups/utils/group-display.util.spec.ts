import {
  buildSearchRequest,
  capacityLine,
  distanceLine,
  fillPercent,
  hasActiveFilters,
  isFull,
  locationLine,
  meetingBadge,
  whenLine,
} from './group-display.util';
import { PublicGroupSummary } from '@impact-common/shared/contract/web-http.types';

function group(overrides: Partial<PublicGroupSummary> = {}): PublicGroupSummary {
  return {
    id: 'g1',
    title: 'Tuesday Morning Disciple-Makers',
    bookId: 'book-1',
    meetingType: 'in-person',
    startDate: Date.UTC(2026, 8, 9, 10, 30),
    startTimeZone: 'America/New_York',
    leaderLabel: 'Matthew F.',
    ...overrides,
  };
}

describe('meetingBadge', () => {
  it('labels each meeting type', () => {
    expect(meetingBadge(group({ meetingType: 'in-person' }))).toBe('IN PERSON');
    expect(meetingBadge(group({ meetingType: 'online' }))).toBe('ONLINE');
    expect(meetingBadge(group({ meetingType: 'hybrid' }))).toBe('IN PERSON + ONLINE');
  });
});

describe('locationLine', () => {
  it('shows city and state for an in-person group', () => {
    expect(locationLine(group({ city: 'Duluth', state: 'GA' }))).toBe('Duluth, GA');
  });

  it('notes the online option for a hybrid group', () => {
    expect(locationLine(group({ meetingType: 'hybrid', city: 'Duluth', state: 'GA' })))
      .toBe('Duluth, GA · also online');
  });

  it('says nothing more than "Meets online" for an online group', () => {
    // onlineInfo is never published (it holds meeting links and passwords),
    // so there is deliberately nothing further to render.
    expect(locationLine(group({ meetingType: 'online' }))).toBe('Meets online');
  });

  it('degrades gracefully when a group has no city at all', () => {
    // Every in-person group created while the createGroup location bug was
    // live is in this state - it must read as intentional, not broken.
    expect(locationLine(group())).toBe('Location shared by the leader');
  });

  it('copes with a city but no state (non-US groups)', () => {
    expect(locationLine(group({ city: 'Oxford' }))).toBe('Oxford');
  });
});

describe('whenLine', () => {
  it('renders the start in the group\'s own zone', () => {
    expect(whenLine(group())).toContain('2026');
  });

  it('does not render an epoch-zero date as 1970', () => {
    expect(whenLine(group({ startDate: 0 }))).toBe('Date to be announced');
  });
});

describe('distanceLine', () => {
  it('is absent unless the search was a radius search', () => {
    expect(distanceLine(group())).toBeUndefined();
  });

  it('singularises exactly one mile', () => {
    expect(distanceLine(group({ distanceMi: 1 }))).toBe('1 mile away');
    expect(distanceLine(group({ distanceMi: 4.2 }))).toBe('4.2 miles away');
  });

  it('avoids "0 miles away" for something essentially at the origin', () => {
    expect(distanceLine(group({ distanceMi: 0 }))).toBe('Less than a tenth of a mile away');
  });
});

describe('capacityLine and isFull', () => {
  it('describes an uncapped group without exposing a count', () => {
    expect(capacityLine(group())).toBe('Open to new members');
    expect(isFull(group())).toBe(false);
  });

  it('singularises the last spot', () => {
    expect(capacityLine(group({ spotsLeft: 1, maxMembers: 12 }))).toBe('1 spot left');
    expect(capacityLine(group({ spotsLeft: 3, maxMembers: 12 }))).toBe('3 spots left');
  });

  it('reports a full group as full, not as "0 spots left"', () => {
    expect(capacityLine(group({ spotsLeft: 0, maxMembers: 12 }))).toBe('Currently full');
    expect(isFull(group({ spotsLeft: 0, maxMembers: 12 }))).toBe(true);
  });
});

describe('fillPercent', () => {
  it('computes how full a capped group is', () => {
    expect(fillPercent(group({ spotsLeft: 3, maxMembers: 12 }))).toBe(75);
    expect(fillPercent(group({ spotsLeft: 12, maxMembers: 12 }))).toBe(0);
    expect(fillPercent(group({ spotsLeft: 0, maxMembers: 12 }))).toBe(100);
  });

  it('draws no bar for an uncapped group', () => {
    // There is no denominator, so any bar would be invented.
    expect(fillPercent(group())).toBeUndefined();
    expect(fillPercent(group({ spotsLeft: 3 }))).toBeUndefined();
  });

  it('never exceeds its bounds on inconsistent data', () => {
    expect(fillPercent(group({ spotsLeft: 20, maxMembers: 12 }))).toBe(0);
  });
});

describe('buildSearchRequest', () => {
  it('sends nothing at all for an untouched filter panel', () => {
    // An empty param would be read as a real (empty) filter by the function
    // and would fragment the CDN cache key for no benefit.
    expect(buildSearchRequest({ meeting: 'all', starts: 'any' })).toEqual({});
  });

  it('trims the query and drops a whitespace-only one', () => {
    expect(buildSearchRequest({ q: '  duluth  ' })).toEqual({ q: 'duluth' });
    expect(buildSearchRequest({ q: '   ' })).toEqual({});
  });

  it('omits the sentinel values rather than sending them', () => {
    expect(buildSearchRequest({ meeting: 'all' })).toEqual({});
    expect(buildSearchRequest({ starts: 'any' })).toEqual({});
    expect(buildSearchRequest({ meeting: 'online' })).toEqual({ meeting: 'online' });
    expect(buildSearchRequest({ starts: 30 })).toEqual({ startsWithin: 30 });
  });

  it('only sends a radius alongside a centre point', () => {
    // A radius with no coordinates is meaningless and the function ignores
    // it; sending it anyway would just be a misleading cache key.
    expect(buildSearchRequest({ radiusMi: 25 })).toEqual({});
    expect(buildSearchRequest({ coords: { lat: 34, lng: -84 }, radiusMi: 25 }))
      .toEqual({ lat: 34, lng: -84, radiusMi: 25 });
  });

  it('passes a paging cursor through', () => {
    expect(buildSearchRequest({ cursor: '24' })).toEqual({ cursor: '24' });
  });
});

describe('hasActiveFilters', () => {
  it('is false for an untouched panel', () => {
    expect(hasActiveFilters({ meeting: 'all', starts: 'any' })).toBe(false);
    expect(hasActiveFilters({ q: '  ' })).toBe(false);
  });

  it('is true once anything narrows the results', () => {
    expect(hasActiveFilters({ q: 'duluth' })).toBe(true);
    expect(hasActiveFilters({ bookId: 'book-1' })).toBe(true);
    expect(hasActiveFilters({ meeting: 'online' })).toBe(true);
    expect(hasActiveFilters({ starts: 30 })).toBe(true);
    expect(hasActiveFilters({ coords: { lat: 34, lng: -84 } })).toBe(true);
  });
});
