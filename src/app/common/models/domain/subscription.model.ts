import { Timestamp } from "firebase/firestore"
import { BaseModel } from "@impact-common/shared/models/base.model"

// Newsletter and Prayer Team subscribers, merged into one collection
// (`subscriptions`) shared with the admin app - see SubscriptionService's
// own comment. `type` is the only thing distinguishing the two; every
// other field was already identical across the two former collections
// (newsletter_subscriptions, prayer_team_subscriptions).
export type SubscriptionType = 'newsletter' | 'prayer';

export class SubscriptionModel extends BaseModel {
  type: SubscriptionType;
  firstName: string
  lastName: string
  email: string
  date: Timestamp;
}
