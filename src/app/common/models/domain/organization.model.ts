import { BaseModel } from "../base.model";
import { Address } from "./utils/address.model";
import { Phone } from "./utils/phone.model";

// Hand-synced from the admin repo's organization.model.ts (2026-08
// restructure). NOTE: this site never reads the `organizations` collection
// (it is staff-only in Firestore rules) - the model exists here only as a
// type on EventModel/CoachModel/etc. Event venues render from the
// denormalized EventModel.venue snapshot instead.
export interface OrganizationPointOfContact {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: Phone;
    contactId?: string;
}

export class OrganizationModel extends BaseModel {
    name: string;
    // DEPRECATED - superseded by pointOfContact; kept readable for old docs.
    contactName: string;
    address: Address;
    phone: Phone;
    email?: string;
    website?: string;
    pointOfContact?: OrganizationPointOfContact;

    constructor(){
        super();
    }
}
