import { Injectable } from '@angular/core';
import { CloudFunctionsClient } from 'src/app/common/services/data/cloud-functions.client';
import { environment } from 'src/environments/environment';
import { CheckoutForm } from '@impact-common/shared/models/utils/cart.model';
import {
  CapturePaypalOrderResult,
  CreatePaypalOrderRequest,
  CreatePaypalOrderResult,
} from '@impact-common/shared/contract/web-http.types';

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
// Not a discriminated union on purpose - this repo runs with
// strictNullChecks off (see tsconfig.json), which makes TS's discriminated-
// union narrowing unreliable. `free` is the field to check; the other
// fields are only ever populated on the matching branch.
// Payment was already captured by PayPal when recordingFailed is true - the
// server just couldn't save the Purchase record afterward. Never treat this
// as a normal failure (the customer WAS charged); see
// paypal.functions.ts#capture_paypal_order's own comment on this path. Same
// "flat, not a union" reasoning as CreateOrderResult above.
// The checkout request/response shapes are the shared web-http contract
// (@impact-common/shared/contract/web-http.types, Stage 2e-ii) - the same
// types the create_paypal_order / capture_paypal_order functions cast their
// request bodies with. Local names kept as aliases for existing importers.
export type CheckoutOrderRequest = CreatePaypalOrderRequest;
export type { CreateOrderBreakdown } from '@impact-common/shared/contract/web-http.types';
export type CreateOrderResult = CreatePaypalOrderResult<CheckoutForm>;
export type CaptureOrderResult = CapturePaypalOrderResult<CheckoutForm>;

@Injectable({
  providedIn: 'root'
})
export class CheckoutOrderService {

  constructor(private client: CloudFunctionsClient) {}

  async createOrder(request: CheckoutOrderRequest): Promise<CreateOrderResult> {
    return this.client.post<CreateOrderResult>(
      environment.createPaypalOrderUrl, request,
      { fallbackError: 'Failed to start checkout' }
    );
  }

  async captureOrder(orderId: string, payerID?: string): Promise<CaptureOrderResult> {
    return this.client.post<CaptureOrderResult>(
      environment.capturePaypalOrderUrl, { orderId, payerID },
      { fallbackError: 'Failed to complete payment' }
    );
  }
}
