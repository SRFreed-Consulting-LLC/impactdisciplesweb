import { LocationModel } from './location.model';
import { BaseModel } from "@impact-common/shared/models/base.model";
import { AppUser } from '../admin/appuser.model';
import { Timestamp } from 'firebase/firestore';
import { OrganizationModel } from './organization.model';
import { AgendaItem } from './utils/agenda-item.model';
import { FAQModel } from '@impact-common/shared/models/utils/faq.model';
import { ImageModel } from '@impact-common/shared/models/utils/image.model';
import { Address } from '@impact-common/shared/models/domain/utils/address.model';

// Where this event happens, snapshotted by the ADMIN app at save time from
// the chosen location record - or, when the organization has no location
// children, from the org's own name + address. Denormalized on purpose:
// this site renders it directly, because `organizations` is staff-only
// readable in Firestore rules. Old events may lack it - fall back to the
// LocationPipe over `event.location` (hand-synced from the admin repo's
// event.model.ts, 2026-08 restructure).
export interface EventVenue {
  name: string;
  address: Address;
}

export class EventModel extends BaseModel {
  isActive = false;
  eventName?: string;
  organization?: string | OrganizationModel;
  startDate?: Timestamp | Date | string;
  endDate?: Timestamp | Date | string;
  // Optional as of the 2026-08 restructure - a single-site org's event has
  // no location record and the venue is the org's own address (see `venue`).
  location?: string | LocationModel;
  venue?: EventVenue;
  attendees?: AppUser[];
  agendaItems?: AgendaItem[];
  description?: string;
  costInDollars?: number;
  isSummit?: boolean = false;
  isOnline?: boolean = false;
  isKajabiCourse?: boolean = false;
  kajabiPurchaseURL?: string;
  kajabiSubscribeURL?: string;
  imageUrl?: ImageModel;
  emailTemplate?: string;
  videoId?: string;
  faqList: FAQModel[] = [];
  checkIn?: Timestamp;
  diningOptions?: string;
  whatsNext?: string;
  checkinInstructions?: string;
}
