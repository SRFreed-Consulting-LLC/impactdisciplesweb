import { BaseModel } from "@impact-common/shared/models/base.model";
import { TrainingRoomModel } from "@impact-common/shared/models/domain/training-room.model";
import { Address } from "@impact-common/shared/models/domain/utils/address.model";
import { Phone } from "@impact-common/shared/models/domain/utils/phone.model";

// A site belonging to an organization (hand-synced from the admin repo's
// location.model.ts, 2026-08 restructure - locations are child records of
// organizations now, administered from the admin app's Contacts Manager).
// The collection stays top-level `locations`: this site's LocationPipe and
// the summit schedule's room lookups read `locations/{id}` directly.
export class LocationModel extends BaseModel {
  name: string;
  address: Address;
  contactName: string;
  phone: Phone;
  trainingrooms: TrainingRoomModel[];
  // Parent org's id (organizations/{id}); old docs may still carry a full
  // object - treat string as the only real shape in new code.
  organization: string;
  // Exactly one location carries this: the fixed Summit venue. Admin-side
  // concern (set by an admin script, read by the admin Summit screen);
  // declared here only to keep the models in sync.
  isSummitVenue?: boolean;
}
