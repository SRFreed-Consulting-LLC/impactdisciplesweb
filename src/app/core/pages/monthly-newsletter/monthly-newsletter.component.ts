import { Component, OnInit } from '@angular/core';
import { MonthlyNewsletterModel } from 'impactdisciplescommon/src/models/domain/monthly-newsletter.model';
import { MonthlyNewletterService } from 'impactdisciplescommon/src/services/data/monthly-newsletter.service';
import { NewsletterService } from 'impactdisciplescommon/src/services/data/newletter.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-monthly-newsletter',
  templateUrl: './monthly-newsletter.component.html',
  styleUrls: ['./monthly-newsletter.component.scss']
})
export class MonthlyNewsletterComponent implements OnInit {

  newletters: MonthlyNewsletterModel[] = []

  constructor(private newsletterService: MonthlyNewletterService) { }

  async ngOnInit() {
    this.newletters = await this.newsletterService.getAll();

    let datSorter = (a,b) => {
      return new Date(b.date as string).getTime() - new Date(a.date as string).getTime()
    };

      this.newletters.sort(datSorter);
  }
}
