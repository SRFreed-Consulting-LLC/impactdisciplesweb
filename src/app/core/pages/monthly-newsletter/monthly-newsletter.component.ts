import { Component, OnInit } from '@angular/core';
import { MonthlyNewsletterModel } from 'src/app/common/models/domain/monthly-newsletter.model';
import { MonthlyNewletterService } from 'src/app/common/services/data/monthly-newsletter.service';


@Component({
    selector: 'app-monthly-newsletter',
    templateUrl: './monthly-newsletter.component.html',
    styleUrls: ['./monthly-newsletter.component.scss'],
    standalone: false
})
export class MonthlyNewsletterComponent implements OnInit {

  newletters: MonthlyNewsletterModel[] = []

  // Server-side cap: newest 100 instead of reading the entire growing
  // collection. orderBy(date desc) + limit only -- no composite index needed.
  private readonly maxNewsletters = 100;

  constructor(private newsletterService: MonthlyNewletterService) { }

  async ngOnInit() {
    // getAllOrdered() already queries with orderBy('date', 'desc') --
    // re-sorting client-side here was redundant (not incorrect, just
    // duplicate work on every load).
    this.newletters = await this.newsletterService.getAllOrdered('date', this.maxNewsletters);
  }
}
