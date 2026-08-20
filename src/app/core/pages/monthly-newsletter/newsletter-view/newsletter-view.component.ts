import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NewsletterArchiveService } from 'src/app/common/services/data/newsletter-archive.service';

// One published newsletter issue, rendered on our own page (2026-08-20 -
// previously each row linked out to mailchi.mp). The issue html comes from
// the newsletter_archive function (full document, merge tags resolved,
// scripts stripped server-side) and is rendered in a SANDBOXED iframe via
// srcdoc: no allow-scripts, so nothing in a snapshot can ever run here;
// allow-same-origin is what lets this component read the frame's content
// height and size it to the issue (a scripts-off sandbox can't reach back
// into the parent, so that combination is safe); popups/top-navigation
// allow the issue's links to work.
@Component({
    selector: 'app-newsletter-view',
    templateUrl: './newsletter-view.component.html',
    styleUrls: ['./newsletter-view.component.scss'],
    standalone: false
})
export class NewsletterViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('frame') frame?: ElementRef<HTMLIFrameElement>;

  html: SafeHtml | null = null;
  loading = true;
  notFound = false;
  error = false;
  frameHeight = 1200;

  private resizeTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private archive: NewsletterArchiveService,
    private sanitizer: DomSanitizer
  ) { }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    try {
      const html = id ? await this.archive.html(id) : null;
      if (html === null) {
        this.notFound = true;
      } else {
        // The iframe is sandboxed without scripts, so the document is inert
        // here; bypassing the srcdoc sanitizer is what lets the full
        // <html> document (its own <style>) render as the email looked.
        this.html = this.sanitizer.bypassSecurityTrustHtml(html);
      }
    } catch (err) {
      console.error('Newsletter unavailable', err);
      this.error = true;
    } finally {
      this.loading = false;
    }
  }

  ngAfterViewInit(): void {
    // Poll the frame's content height while images load; cheap and avoids
    // wiring ResizeObserver into a cross-document sandbox. Stops on destroy.
    this.resizeTimer = setInterval(() => this.fitFrame(), 500);
  }

  ngOnDestroy(): void {
    if (this.resizeTimer) {
      clearInterval(this.resizeTimer);
    }
  }

  fitFrame(): void {
    const doc = this.frame?.nativeElement?.contentDocument;
    const body = doc?.body;
    const root = doc?.documentElement;
    if (!body) {
      return;
    }
    const height = Math.max(body.scrollHeight, body.offsetHeight, root?.scrollHeight ?? 0);
    if (height > 200 && Math.abs(height - this.frameHeight) > 8) {
      this.frameHeight = height + 24;
    }
  }
}
