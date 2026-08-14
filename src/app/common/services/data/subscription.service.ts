import { Injectable } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { SubscriptionModel, SubscriptionType } from 'src/app/common/models/domain/subscription.model';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { EMailService } from './email.service';

// Newsletter/Prayer Team subscriber state used to live in its own
// `subscriptions` collection, written straight from this service via the
// client SDK (createSubscription() used to do a query + add() against
// `this.table`). It's now 2 booleans + dates on the matching "customers"
// doc in the admin project instead (see the admin repo's customer.model.ts
// and subscriptions.functions.ts) - this app has no direct write access to
// "customers" (that's the admin repo's collection, not this app's own), so
// createSubscription() now POSTs to the admin repo's
// subscribe_to_email_list Cloud Function instead of writing to Firestore
// directly. SubscriptionModel/BaseService/`this.table` are kept only for
// shape/typing continuity in the 4 call sites (footer, subscribe-area,
// prayer-team, checkout-success) - nothing reads/writes the `subscriptions`
// table itself any more.
@Injectable({
  providedIn: 'root'
})
export class SubscriptionService extends BaseService<SubscriptionModel> {
  constructor(public override dao: FirebaseDAO<SubscriptionModel>, private emailService: EMailService) {
    super(dao)
    this.table = "subscriptions"
  }

  // Returns the subscriber (so callers can pass it to sendConfirmationEmail)
  // on a fresh subscribe, or null if this email was already subscribed to
  // this type - same true/null contract the old query-then-add() version
  // had, just backed by the Cloud Function's `alreadySubscribed` response
  // field instead of a client-side Firestore query.
  async createSubscription(type: SubscriptionType, firstName: string, lastName: string, email: string): Promise<SubscriptionModel | null> {
    const response = await fetch(environment.subscribeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, firstName, lastName, email })
    });

    if (!response.ok) {
      throw new Error('Failed to subscribe: ' + response.status);
    }

    const result: { subscribed: boolean; alreadySubscribed: boolean } = await response.json();
    if (result.alreadySubscribed) {
      return null;
    }

    return { ...new SubscriptionModel(), type, firstName, lastName, email, date: Timestamp.now() };
  }

  // Content branches on `type` - preserves each type's exact previous
  // subject/body/format (Newsletter: HTML, includes a free ebook link;
  // Prayer: plain text, no ebook link). Unaffected by the write-path change
  // above - this only ever sent an email, never touched Firestore itself.
  sendConfirmationEmail(subscription: SubscriptionModel){
    if (subscription.type === 'prayer') {
      const subject = 'Thank you for Joining our Prayer Team! ';
      let text = 'Dear ' + subscription.firstName + '.\n\n'
      text += 'Your email address was successfully added to our Prayer Team List! (' + subscription.email +')\n\n'
      text +='God Bless! - Impact Disciples Ministry'

      text += "<br><br><br><div>If you believe you received this confirmation by mistake, please click " +
        "<b><a href='" + environment.unsubscribeUrl + "?email="+ subscription.email +
        "&type=prayer'>here</a></b> to remove your address.</div>"

      this.emailService.sendTextEmail(subscription.email, subject, text);
      return;
    }

    const subject = 'Thank you for Subscribing to the Impact Disciples Newletter!';
    let text = '<div>Dear ' + subscription.firstName + '.</div><br><br>'
    text += '<div>Your email address was successfully added to our Newletter Subsciption List! (' + subscription.email +')</div><br><br>'
    text += '<div>Please accept this free <a href="' + environment.freeEbookUrl +'" download>EBook</a> as a small token of our appreciation.</div><br><br>'
    text +='<div>God Bless! - Impact Disciples Ministry</div>'

    text += "<br><br><br><div>If you believe you received this confirmation by mistake, please click " +
      "<b><a href='" + environment.unsubscribeUrl + "?email="+ subscription.email +
      "&type=newsletter'>here</a></b> to remove your address.</div>"

    this.emailService.sendHtmlEmail(subscription.email, subject, text);
  }
}
