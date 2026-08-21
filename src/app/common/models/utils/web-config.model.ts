import { Timestamp } from "firebase/firestore";
import { BaseModel } from "@impact-common/shared/models/base.model";
import { Address } from "@impact-common/shared/models/domain/utils/address.model";

export class WebConfigModel extends BaseModel{
  policy: string;
  tos: string
  countdownEndDateTime: Timestamp | null;
  images: string [ ] | null;
  email: string;
  phone: string;
  address: Address;
  logo: string;
  twitter: string | null;
  facebook: string | null;
  facebookLive: string | null;
  applePodCast: string | null;
  linkedIn: string | null;
  youtube: string | null;
  instagram: string | null ;
  inpersonSeminarCost: number;
  onlineSeminarCost: number;
  equippingGroupTotalCost: number;
  equippingGroupPaymentCost: number;
  adminEmailAddress: string;
  taxImportDate?: Timestamp;
  freeShippingAmount: number;
  // paypalClientId is a public client identifier, safe to keep here. Secrets
  // are not: `config` is world-readable under the current firestore.rules, so
  // anything stored here is effectively published. The apilayer tax key used
  // to live on this model and now comes from Secret Manager (TAX_API_KEY),
  // read server-side in the admin project's checkout-pricing.functions.ts.
  paypalClientId?: string;
}
