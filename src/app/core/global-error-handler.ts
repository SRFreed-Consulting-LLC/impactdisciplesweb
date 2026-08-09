import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { LoggerService } from 'src/app/common/services/data/logger.service';

/**
 * App-wide fallback for uncaught exceptions (template errors, unhandled
 * RxJS errors, etc.) that previously just vanished into the browser
 * console with no record anywhere. Logs to the console (always) and to
 * the existing LoggerService (Firestore "log-messages" collection, the
 * same sink AdminAuthService already uses for login failures) so errors
 * are actually visible after the fact.
 *
 * Uses Injector rather than constructor injection to avoid a circular-DI
 * risk -- ErrorHandler is instantiated very early in the bootstrap
 * process, and we don't want a failure to resolve LoggerService's own
 * dependencies to prevent the app from starting.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: unknown): void {
    // Always do this first and unconditionally -- handleError must never
    // itself throw, or an error encountered while handling an error would
    // be silently dropped entirely.
    console.error('Unhandled error:', error);

    try {
      const loggerService = this.injector.get(LoggerService);
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      loggerService.logMessage('UNCAUGHT_ERROR', 'system', message, [{ stack }]).subscribe({
        error: (loggingError) => console.error('Failed to log error to Firestore:', loggingError),
      });
    } catch (loggingError) {
      console.error('Failed to log error to Firestore:', loggingError);
    }
  }
}
