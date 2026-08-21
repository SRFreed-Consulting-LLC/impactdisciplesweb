import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CheckoutForm } from '@impact-common/shared/models/utils/cart.model';

// Client for the two server-side checkout Cloud Functions
// (create_paypal_order / capture_paypal_order,
// impactdisciples-admin/functions/src/paypal.functions.ts) that price,
// tax, and verify a checkout server-side instead of trusting the client.
//
// Ported from a separate, unmerged branch (checkout-server-side-pricing, in
// both this repo and impactdisciples-admin) that predates this repo's
// store/cart/checkout rewrite -- it fixed a real vulnerability: checkout
// used to compute the entire order total client-side and write the "paid"
// Purchase record straight to Firestore with no server check, which,
// combined with Firestore's wide-open rules, meant cart prices could be
// tampered with in devtools (or a fake order written directly) to get
// products for free. The server is now the only source of truth for what
// gets charged and what gets written to the "purchases" collection -- see
// CheckoutOrderRequest below for exactly what this app is still allowed to
// tell the server (never a price).
export interface CheckoutOrderRequest {
  cartItems: {
    id: string;
    isEvent?: boolean;
    isEBook?: boolean;
    isDigitalBook?: boolean;
    orderQuantity: number;
    size?: string;
    color?: string;
    language?: string;
    attendees?: unknown[];
    followUpEmailId?: string;
  }[];
  couponCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: unknown;
  isNewsletter?: boolean;
  isShippingSameAsBilling?: boolean;
  billingAddress?: unknown;
  shippingAddress?: unknown;
  shippingRate?: number;
  shippingRateId?: unknown;
  // Campaign attribution captured on landing (AttributionService) - the
  // server validates the campaign exists before crediting anything, so
  // this stays advisory, never a price/priv input.
  attribution?: { campaignId: string; emailId?: string; source?: string };
}

export interface CreateOrderBreakdown {
  subtotal: number;
  totalDiscount: number;
  estimatedTaxes: number;
  taxRate: number;
  taxSource: string;
  shippingDiscount: number;
  shippingDiscountReason: string;
  total: number;
}

// Not a discriminated union on purpose - this repo runs with
// strictNullChecks off (see tsconfig.json), which makes TS's discriminated-
// union narrowing unreliable. `free` is the field to check; the other
// fields are only ever populated on the matching branch.
export interface CreateOrderResult {
  free: boolean;
  checkoutForm?: CheckoutForm;
  orderId?: string;
  breakdown?: CreateOrderBreakdown;
}

// Payment was already captured by PayPal when recordingFailed is true - the
// server just couldn't save the Purchase record afterward. Never treat this
// as a normal failure (the customer WAS charged); see
// paypal.functions.ts#capture_paypal_order's own comment on this path. Same
// "flat, not a union" reasoning as CreateOrderResult above.
export interface CaptureOrderResult {
  checkoutForm?: CheckoutForm;
  recordingFailed?: boolean;
  errorCode?: string;
  payPalOrderId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutOrderService {

  async createOrder(request: CheckoutOrderRequest): Promise<CreateOrderResult> {
    const response = await fetch(environment.createPaypalOrderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || 'Failed to start checkout');
    }

    return data;
  }

  async captureOrder(orderId: string, payerID?: string): Promise<CaptureOrderResult> {
    const response = await fetch(environment.capturePaypalOrderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, payerID })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || 'Failed to complete payment');
    }

    return data;
  }
}
