import { Injectable } from '@angular/core';
import { EventRegistrationModel } from '@impact-common/shared/models/domain/event-registration.model';
import { environment } from 'src/environments/environment';
import { AttributionService } from 'src/app/shared/utils/services/attribution.service';
import {
  CheckRegistrationExistsResult,
  GetEventRegistrationResult,
  GetSessionCountsResult,
  RegisterForEventResult,
  UpdateMySessionsResult,
} from '@impact-common/shared/contract/web-http.types';

// Pre-prod hardening #2: every public event-registration flow goes through
// Cloud Functions now - the collection itself is staff-only under
// firestore.rules. The identity model is unchanged and deliberate:
// attendees have no accounts, so the registration's own unguessable doc id
// (carried in the confirmation email's breakout link) IS the credential.
// What died: the by-email lookup (emails are guessable; links aren't), the
// full-roster stream (the schedule only ever needed per-session COUNTS),
// and anonymous whole-doc writes (session changes are a narrow server-side
// mutation). This service no longer extends BaseService - the web app has
// no direct Firestore access to this collection at all.
@Injectable({
  providedIn: 'root'
})
export class EventRegistrationService {

  constructor(private attributionService: AttributionService) {}

  private async post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }
    return response.json() as Promise<T>;
  }

  /** Creates the registration server-side - which also renders + queues
   *  the confirmation email (with the breakout link) and stamps
   *  receiptEmailId, replacing the old client-side create/email/update
   *  dance in one call. */
  async registerForEvent(input: {
    eventId: string;
    firstName: string;
    lastName: string;
    email: string;
    receipt?: string;
  }): Promise<RegisterForEventResult> {
    // Campaign attribution (Campaign Manager v2, Phase 4) - a registration
    // that follows a campaign click credits that campaign's funnel.
    const attribution = this.attributionService.get();
    return this.post(environment.registerForEventUrl, {
      ...input,
      email: input.email.toLowerCase(),
      ...(attribution ? { attribution } : {}),
    });
  }

  /** Fetch by the emailed link's unguessable registration id. */
  async getEventRegistrationById(id: string): Promise<EventRegistrationModel | null> {
    const result = await this.post<GetEventRegistrationResult<EventRegistrationModel>>(
      environment.getEventRegistrationUrl,
      { registrationId: id },
    );
    if (!result.registration) {
      return null;
    }
    const { registrationDateIso, ...registration } = result.registration;
    registration.registrationDate = registrationDateIso ? new Date(registrationDateIso) : undefined;
    return registration as EventRegistrationModel;
  }

  /** Boolean-only duplicate check for the signup form's validator. */
  async isAlreadyRegistered(email: string, eventId: string): Promise<boolean> {
    const result = await this.post<CheckRegistrationExistsResult>(environment.checkRegistrationExistsUrl, {
      eventId,
      email: email.toLowerCase(),
    });
    return result.exists;
  }

  async registerForTrainingSession(registrationId: string, agendaItemId: string): Promise<string[]> {
    const result = await this.post<UpdateMySessionsResult>(environment.updateMySessionsUrl, {
      registrationId,
      sessionId: agendaItemId,
      action: 'add',
    });
    return result.trainingSessions;
  }

  async unregisterForTrainingSession(registrationId: string, agendaItemId: string): Promise<string[]> {
    const result = await this.post<UpdateMySessionsResult>(environment.updateMySessionsUrl, {
      registrationId,
      sessionId: agendaItemId,
      action: 'remove',
    });
    return result.trainingSessions;
  }

  /** Per-session registration counts - all the capacity display needs. */
  async getSessionCounts(eventId: string): Promise<Record<string, number>> {
    const result = await this.post<GetSessionCountsResult>(
      environment.getSessionCountsUrl,
      { eventId },
    );
    return result.counts;
  }
}
