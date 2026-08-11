import { BaseModel } from "../../base.model";

export class AgendaItem extends BaseModel{
  text: string;
  name: string;
  startDate: Date;
  endDate: Date;
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
