import { Injectable } from '@angular/core';
import { AttributionService } from 'src/app/shared/utils/services/attribution.service';

// One transport for the Cloud Functions this app talks to (bucket A, web
// item 4, 2026-08-21). Eleven raw fetch() sites across eight files each
// re-implemented some subset of: build the request, check response.ok,
// parse the JSON, throw something.
//
// This app has no HttpClient anywhere (deliberately - see CLAUDE.md), so
// this is a thin wrapper over fetch rather than an Angular HTTP service.
//
// Deliberately THREE methods rather than one post() with a bag of flags.
// The sweep described these sites as eleven copies of one POST helper;
// measuring them showed four genuinely different behaviours, and flattening
// those into a single signature would have meant an options object with a
// flag per caller - worse than the duplication it replaced. So: post() and
// get() share the check-parse-throw core, beacon() is fire-and-forget, and
// the one caller that must NOT throw (coupon lookup) keeps that as an
// explicit try/catch at its own call site where it is visible.

/** Thrown by post()/get() on any non-2xx. Carries the parsed body. */
export class CloudFunctionError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
    message: string
  ) {
    super(message);
    this.name = 'CloudFunctionError';
  }
}

export interface CloudFunctionPostOptions {
  /**
   * Attach the visitor's campaign attribution to the body when there is
   * one (Campaign Manager v2, Phase 4). Only the two calls whose funnel
   * stage is credited server-side set this.
   */
  withAttribution?: boolean;
  /**
   * Message to throw when the response body carries no `error` of its own.
   * Each call site keeps its own wording - the checkout pair in particular
   * have distinct, customer-visible fallbacks.
   */
  fallbackError?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CloudFunctionsClient {
  constructor(private attributionService: AttributionService) {}

  async post<T>(
    url: string,
    body: unknown,
    options: CloudFunctionPostOptions = {}
  ): Promise<T> {
    let payload = body;
    if (options.withAttribution) {
      const attribution = this.attributionService.get();
      if (attribution) {
        payload = { ...(body as object), attribution };
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return this.unwrap<T>(response, options.fallbackError);
  }

  async get<T>(url: string, options: { fallbackError?: string } = {}): Promise<T> {
    return this.unwrap<T>(await fetch(url), options.fallbackError);
  }

  /**
   * Tracking beacon: never awaited, never throws, and its failure must
   * never be visible to the visitor. A dropped beacon costs one analytics
   * event; a thrown one would break the page it was fired from.
   *
   * Prefers navigator.sendBeacon, which the browser will still deliver
   * after the page starts unloading - a plain fetch is cancelled at that
   * point, and the most interesting beacons fire on the click that
   * navigates away. Taken from campaign-popup's own implementation, which
   * already got this right.
   */
  beacon(url: string): void {
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url);
      } else {
        fetch(url).catch(() => undefined);
      }
    } catch {
      // best-effort only
    }
  }

  private async unwrap<T>(response: Response, fallbackError?: string): Promise<T> {
    // Parsed before the ok check on purpose: the functions return their
    // error text in the JSON body, and that message is the one worth
    // surfacing. A body that is not JSON at all (a gateway error page, an
    // empty 502) must not mask the real status, hence the catch.
    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const fromBody = (data as { error?: unknown })?.error;
      const message = typeof fromBody === 'string' && fromBody ?
        fromBody :
        (fallbackError || `Request failed (${response.status})`);
      throw new CloudFunctionError(response.status, data, message);
    }

    return data as T;
  }
}
