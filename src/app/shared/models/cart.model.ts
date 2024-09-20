import { PaymentIntent } from "@stripe/stripe-js";
import { BaseModel } from "impactdisciplescommon/src/models/base.model";
import { Address } from "impactdisciplescommon/src/models/domain/utils/address.model";
import { Phone } from "impactdisciplescommon/src/models/domain/utils/phone.model";

export interface CartItem {
  id?: string;
  itemName?: string;
  price?: number;
  orderQuantity?: number;
  discount?: number;
  isEvent?: boolean;
  img?: string;
  attendees?: Attendee[];
}

export interface Attendee {
  firstName: string;
  lastName: string;
  email: string;
  receipt?: string;
}

export interface CheckoutForm extends BaseModel {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: Phone;
  isShippingSameAsBilling?: boolean;
  billingAddress?: Address;
  shippingAddress?: Address;
  cartItems?: CartItem[];
  total?: number;
  receipt?: string;
  isNewsletter?: boolean;
  isCreateAccount?: boolean;
  couponCode?: string;
  paymentIntent?: PaymentIntent;
}
