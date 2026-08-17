import { Injectable } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { SubscriptionModel, SubscriptionType } from 'src/app/common/models/domain/subscription.model';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';

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
  constructor(public override dao: FirebaseDAO<SubscriptionModel>) {
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

  // sendConfirmationEmail is retired (pre-prod #1): the confirmation is
  // queued server-side by subscribe_to_email_list itself on a fresh
  // subscribe - the mail collection no longer accepts anonymous creates.
}
