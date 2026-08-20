import { Component, OnInit } from '@angular/core';
import { NewsletterArchiveItem, NewsletterArchiveService } from 'src/app/common/services/data/newsletter-archive.service';

// Public list of published newsletter issues. Since 2026-08-20 this reads
// the admin-curated archive (campaign_emails touches flagged publishToWeb,
// served by the newsletter_archive function) instead of the retired
// `monthly-newsletter` collection of Mailchimp links; each row opens the
// issue on our own /monthly-newsletter/:id page rather than on mailchi.mp.
@Component({
    selector: 'app-monthly-newsletter',
    templateUrl: './monthly-newsletter.component.html',
    styleUrls: ['./monthly-newsletter.component.scss'],
    standalone: false
})
export class MonthlyNewsletterComponent implements OnInit {

  newsletters: NewsletterArchiveItem[] = [];
  loading = true;
  error = false;

  constructor(private archive: NewsletterArchiveService) { }

  async ngOnInit() {
    try {
      // Already newest-first from the endpoint (sentAt desc).
      this.newsletters = await this.archive.list();
    } catch (err) {
      console.error('Newsletter archive unavailable', err);
      this.error = true;
    } finally {
      this.loading = false;
    }
  }
}
