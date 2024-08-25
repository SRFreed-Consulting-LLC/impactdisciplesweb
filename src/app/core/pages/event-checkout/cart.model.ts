import { Address } from "impactdisciplescommon/src/models/domain/utils/address.model";
import { Person } from "impactdisciplescommon/src/models/domain/utils/person.model";

export interface CartItem {
  eventId: string;
  eventName: string;
  price: number;
  quantity: number;
}

export interface CheckoutForm {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: Address;
  attendees?: Attendee[];
  eventId?: string;
  cartItem?: CartItem;
  total?: number;
}

export interface Attendee {
  firstName: string;
  lastName: string;
  email?: string;
}

