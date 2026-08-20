import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

// One published newsletter issue as the public archive lists it.
export interface NewsletterArchiveItem {
  id: string;
  title: string;
  date: Date | null;
}

// Public newsletter archive (2026-08-20). The Monthly Newsletter page used
// to read a hand-maintained `monthly-newsletter` Firestore collection of
// Mailchimp archive links; the issues themselves now live on the admin's
// campaign_emails touches (html snapshot per sent email), and an admin
// flags which ones are public. That collection is staff-only, so the
// ONLY public read path is the admin repo's `newsletter_archive` function:
//   GET <url>          -> { newsletters: [{ id, title, date }] }
//   GET <url>?id=<id>  -> text/html of one issue (script-less, CORS-open)
// Plain fetch like the popup beacon / subscribe calls - no Firestore here.
@Injectable({
  providedIn: 'root'
})
export class NewsletterArchiveService {
  private readonly baseUrl = environment.newsletterArchiveUrl;

  async list(): Promise<NewsletterArchiveItem[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      throw new Error(`newsletter archive list failed: ${response.status}`);
    }
    const body = await response.json();
    return NewsletterArchiveService.parseList(body);
  }

  // Resolves to null on 404 (unknown id or not published) so the view can
  // show a friendly "not found" instead of throwing.
  async html(id: string): Promise<string | null> {
    const response = await fetch(this.issueUrl(id));
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`newsletter archive fetch failed: ${response.status}`);
    }
    return response.text();
  }

  issueUrl(id: string): string {
    return `${this.baseUrl}?id=${encodeURIComponent(id)}`;
  }

  // Pure + static so the spec can cover the shape without fetch.
  static parseList(body: unknown): NewsletterArchiveItem[] {
    const raw = (body as { newsletters?: unknown })?.newsletters;
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw
      .filter((n): n is { id: string; title?: string; date?: string | null } =>
        !!n && typeof (n as { id?: unknown }).id === 'string')
      .map((n) => {
        const parsed = n.date ? new Date(n.date) : null;
        return {
          id: n.id,
          title: (n.title ?? '').trim() || 'Newsletter',
          date: parsed && !isNaN(parsed.getTime()) ? parsed : null
        };
      });
  }
}
