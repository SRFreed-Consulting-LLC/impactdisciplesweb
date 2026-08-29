import { Component } from '@angular/core';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PageContentService } from 'src/app/common/services/data/page-content.service';

// Giving is entirely link-out: the three buttons open the hosted Stripe
// Payment Link / PayPal donate pages from environment.{oneGiftUrl,
// monthlyGiftUrl, impactPartnersGiftUrl} in a new tab. The former embedded
// Stripe Elements form (create_payment_intent + confirmPayment +
// return_url status check) was never reachable from this template and was
// removed in the 2026-08-20 refactor sweep along with StripeService.
@Component({
    selector: 'app-give',
    templateUrl: './give.component.html',
    styleUrls: ['./give.component.scss'],
    standalone: false
})
export class GiveComponent {
  public impactDisciplesInfo = impactDisciplesInfo;
  public environment = environment;

  /** Editable copy by slot key; every template use falls back to its own. */
  readonly content$: Observable<Record<string, PageContentBlock>>;

  window = window;

  constructor(pageContent: PageContentService) {
    this.content$ = pageContent.blocksFor('give');
  }
}
