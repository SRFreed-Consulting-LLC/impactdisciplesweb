import { BaseModel } from "../../base.model";

// One entry in EventModel.agendaItems[] (hand-synced from the admin repo's
// agenda-item.model.ts, 2026-08 Courses retirement). A breakout session is
// an item with isCourse: true and is fully self-contained: `text` is the
// breakout's title, `description` its description, `coaches` its
// instructor(s). trainingSessions on a registration holds these items' ids.
export class AgendaItem extends BaseModel{
  // For a breakout (isCourse) item: the breakout's display title. For plain
  // agenda items: the free-text line shown on the schedule.
  text: string;
  name: string;
  startDate: Date;
  endDate: Date;
  // LEGACY (frozen): pre-retirement link to a courses/{id} doc. Never
  // written by new admin saves; still read as the fallback key for the
  // "same session at another time" conflict check on old items.
  course?: string;
  coaches?: string[];
  isCourse?: boolean;
  isBreakout?: boolean;
  isFoodBreak?: boolean;
  maxParticipants?: number;
  signedUp?: number;
  description?: string;
  room?: string;
  // Emails of users who asked to be waitlisted once maxParticipants was hit
  // (breakout-sessions.component.ts) - always used at runtime, just never
  // declared here (only surfaced once viewCourse()'s item param stopped
  // being typed any).
  waitList?: string[];
}
