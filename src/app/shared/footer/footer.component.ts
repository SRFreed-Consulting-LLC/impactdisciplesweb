import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SubscriptionModel } from 'src/app/common/models/domain/subscription.model';
import { SubscribeFormService } from 'src/app/shared/utils/services/subscribe-form.service';
import { FooterView, SiteFooterService } from 'src/app/common/services/data/site-footer.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})
export class FooterComponent implements OnInit, OnDestroy {
  /**
   * The footer's own words - headings, link columns, copyright - from
   * Firestore (2026-08-30). The service emits the bundled copy first, so this
   * is never empty and the footer does not flash blank on a cold load.
   */
  footer?: FooterView;

  /**
   * Address, phone, email and the social links.
   *
   * From `web_config`, NOT from the hardcoded impact-disciples.data.ts this
   * component used to read. That file was a second copy of details that
   * already lived in an editable config, and the site was rendering the copy
   * nobody could reach - so changing the address in the admin changed
   * nothing here.
   *
   * One visible consequence, and it is intended: the template renders
   * LinkedIn and Instagram icons, and the hardcoded file had neither field.
   * Whatever web_config holds for those now shows.
   */
  config?: WebConfigModel;

  subscription: SubscriptionModel = {... new SubscriptionModel(), type: 'newsletter'};

  private subs = new Subscription();

  constructor(
    private subscribeForm: SubscribeFormService,
    private siteFooter: SiteFooterService,
    private webConfig: WebConfigService
  ){}

  ngOnInit(): void {
    this.subs.add(this.siteFooter.footer$.subscribe((footer) => this.footer = footer));
    // getAll() is cached on the service for the session - every page mounts
    // this component, and the config is effectively static.
    this.webConfig.getConfig()
      .then((config) => this.config = config)
      .catch((err) => console.error('FooterComponent: could not read web config:', err));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** The address as one line. WebConfigModel stores it structured, while the
   *  hardcoded copy was a single string - so the joining that used to happen
   *  in the data file happens here. */
  get addressLine(): string {
    const address = this.config?.address;
    if (!address) {
      return '';
    }
    const parts = [address.address1, address.address2, address.city, address.state, address.zip];
    return parts.filter((part) => !!part && String(part).trim()).join(', ');
  }

  /**
   * The phone number, spaced out to read as one.
   *
   * web_config stores it as bare digits - "6788549322" - while the hardcoded
   * copy the footer used to render was already formatted, "+ 678 854 9322".
   * Caught by comparing the live site against this one: everything else about
   * the footer matched and the phone came out as a run of ten digits, which
   * is a real regression rather than a difference worth accepting.
   *
   * Formatted here rather than reformatting the stored value, because the
   * stored digits are what other things dial and match on.
   */
  get phoneLine(): string {
    const raw = (this.config?.phone ?? '').trim();
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+ ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+ ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    // Anything else is left exactly as stored - a guess at an unfamiliar
    // shape would be worse than showing what somebody typed.
    return raw;
  }

  handleFormSubmit() {
    return this.subscribeForm.submit('newsletter', this.subscription);
  }
}
