import { BaseModel } from "@impact-common/shared/models/base.model";

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
  // Emails queued for a FULL breakout session. Written only by the admin
  // app (Summit Command Center: EventService.addToWaitList/removeFromWaitList)
  // - the web app reads the shape but no longer offers a self-service
  // wait-list prompt (the old one never persisted; removed 2026-08-20).
  waitList?: string[];
}
