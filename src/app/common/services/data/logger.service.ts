import { Injectable } from "@angular/core";
import { LogMessage } from "@impact-common/shared/models/utils/log-message.model";
import { FirebaseDAO } from '../../dao/firebase.dao';
import { Timestamp } from "firebase/firestore";
import { dateFromTimestamp } from "@impact-common/shared/utils/date-from-timestamp";
import { BaseService } from "./base.service";
import { Observable, catchError, from, map, of } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class LoggerService extends BaseService<LogMessage> {
  constructor(public override dao: FirebaseDAO<LogMessage>) {
    super(dao)
    this.table="log-messages"
    this.fromFirestore = LoggerService.fromFirestore
  }

  static readonly fromFirestore = (data: LogMessage): LogMessage => {
    data.date = dateFromTimestamp(data.date as Timestamp)

    return data;
  };

  logMessage(type: string, created_by: string, message: string, data?: unknown): Observable<string | boolean> {
    try {
      const ec = this.generateErrorCode();
      const logMessage: LogMessage = { ...new LogMessage(type, created_by, message, ec, LoggerService.sanitizeData(data)) };
      logMessage.id = this.generateErrorCode();

      // A log line is best-effort and must never break its caller: resolve
      // with the code even if the write is refused (the admin's copy of this
      // service left a login screen spinning that way on 2026-09-04).
      return from(this.add(logMessage)).pipe(
        map(() => ec),
        catchError((err) => {
          console.error('Could not write a log message', err);
          return of(ec);
        })
      );
    } catch (err) {
      console.error(err);

      return of(true);
    }
  }

  // Firestore rejects custom class instances (Error, FirebaseError) and
  // undefined values inside addDoc payloads -- and several call sites pass
  // a caught error straight in as { err }. Reduce everything to plain
  // JSON-safe values so logging an error can never itself throw.
  private static sanitizeData(data: unknown): unknown {
    if (data === undefined) {
      return undefined;
    }
    try {
      return JSON.parse(JSON.stringify(data, (_key, value) => {
        if (value instanceof Error) {
          return { name: value.name, message: value.message, stack: value.stack ?? null };
        }
        return value === undefined ? null : value;
      }));
    } catch {
      return { unserializable: String(data) };
    }
  }

  private generateErrorCode() {
    return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
