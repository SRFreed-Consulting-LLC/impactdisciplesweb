import { PublicGroupSummary } from '@impact-common/shared/contract/web-http.types';
import { formatGroupDateTimeForViewer } from '@impact-common/groups/group-datetime.util';

/**
 * Presentation helpers for the public Impact Group finder. Pure on purpose:
 * the components stay thin, and this is where the finder's behaviour is
 * actually pinned by tests.
 */

export type MeetingFilter = 'all' | 'in-person' | 'online' | 'hybrid';
export type StartsFilter = 'any' | 30 | 90;

/** Badge text for a group card. */
export function meetingBadge(group: PublicGroupSummary): string {
  switch (group.meetingType) {
    case 'online':
      return 'ONLINE';
    case 'hybrid':
      return 'IN PERSON + ONLINE';
    default:
      return 'IN PERSON';
  }
}

/**
 * Where the group meets, in one line. Online groups deliberately say only
 * "Meets online" - the actual joining details (`onlineInfo`) are never
 * published, so there is nothing more to show a stranger.
 */
export function locationLine(group: PublicGroupSummary): string {
  if (group.meetingType === 'online') {
    return 'Meets online';
  }
  const place = [group.city, group.state].filter(Boolean).join(', ');
  if (!place) {
    // Every in-person group created while the createGroup location bug was
    // live has no city at all. Say so plainly rather than rendering a blank.
    return 'Location shared by the leader';
  }
  return group.meetingType === 'hybrid' ? `${place} · also online` : place;
}

/** When the group meets, rendered in its own zone (falling back to the viewer's). */
export function whenLine(group: PublicGroupSummary): string {
  if (!group.startDate) return 'Date to be announced';
  return formatGroupDateTimeForViewer(group.startDate, group.startTimeZone);
}

/** "4.2 miles away", only on a radius search. */
export function distanceLine(group: PublicGroupSummary): string | undefined {
  if (group.distanceMi === undefined) return undefined;
  if (group.distanceMi < 0.1) return 'Less than a tenth of a mile away';
  const unit = group.distanceMi === 1 ? 'mile' : 'miles';
  return `${group.distanceMi} ${unit} away`;
}

/**
 * Capacity, phrased for a stranger deciding whether to bother. An uncapped
 * group says "Open to new members" rather than exposing a raw count.
 */
export function capacityLine(group: PublicGroupSummary): string {
  if (group.spotsLeft === undefined) return 'Open to new members';
  if (group.spotsLeft <= 0) return 'Currently full';
  if (group.spotsLeft === 1) return '1 spot left';
  return `${group.spotsLeft} spots left`;
}

/** True when the group cannot take anyone else right now. */
export function isFull(group: PublicGroupSummary): boolean {
  return group.spotsLeft !== undefined && group.spotsLeft <= 0;
}

/**
 * How full the group is, 0-100, for the detail page's progress bar.
 * Undefined for an uncapped group - it has no denominator, so there is no
 * honest bar to draw.
 */
export function fillPercent(group: PublicGroupSummary): number | undefined {
  if (group.spotsLeft === undefined || !group.maxMembers) return undefined;
  const taken = group.maxMembers - group.spotsLeft;
  return Math.min(100, Math.max(0, Math.round((taken / group.maxMembers) * 100)));
}

/**
 * Turns the sidebar's filter state into the request the function expects.
 * Keeping this pure means the "what did we actually ask for" logic is
 * testable without a component or a network call.
 */
export function buildSearchRequest(state: {
  q?: string;
  bookId?: string;
  meeting?: MeetingFilter;
  starts?: StartsFilter;
  coords?: { lat: number; lng: number };
  radiusMi?: number;
  cursor?: string;
}): Record<string, unknown> {
  const request: Record<string, unknown> = {};
  const q = state.q?.trim();
  if (q) request['q'] = q;
  if (state.bookId) request['bookId'] = state.bookId;
  // 'all' is the absence of a filter, not a value the function knows.
  if (state.meeting && state.meeting !== 'all') request['meeting'] = state.meeting;
  if (state.starts && state.starts !== 'any') request['startsWithin'] = state.starts;
  if (state.coords) {
    request['lat'] = state.coords.lat;
    request['lng'] = state.coords.lng;
    // Radius is meaningless without a centre, so it only ever travels with one.
    if (state.radiusMi !== undefined) request['radiusMi'] = state.radiusMi;
  }
  if (state.cursor) request['cursor'] = state.cursor;
  return request;
}

/** True when any filter is narrowing the results, for the "Clear all" affordance. */
export function hasActiveFilters(state: {
  q?: string;
  bookId?: string;
  meeting?: MeetingFilter;
  starts?: StartsFilter;
  coords?: { lat: number; lng: number };
}): boolean {
  return !!state.q?.trim() || !!state.bookId ||
    (!!state.meeting && state.meeting !== 'all') ||
    (!!state.starts && state.starts !== 'any') ||
    !!state.coords;
}
