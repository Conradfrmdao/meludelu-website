// Provider-agnostic payment interface (PRD section 9).
// Today the only implementation is merchant USSD: the customer dials the code on their own phone
// and the shop confirms the payment by hand. When a gateway with an API is chosen later
// (MTN MoMo API, Airtel Money API, Flutterwave, Pesapal...), add a new provider here;
// checkout and the admin screens do not need to change.

import type { PaymentMethod } from "../types";

export interface PaymentRequest {
  orderNumber: string;
  amount: number;
  method: PaymentMethod;
  payerPhone: string;
}

export interface PaymentInstructions {
  kind: "ussd" | "manual";
  /** Network label, e.g. "MTN Mobile Money" */
  label: string;
  /** What the customer dials, e.g. "*165*3#". Empty when no merchant code is configured yet. */
  dialString: string;
  /** tel: link that opens the phone's dialler with the USSD code typed in. */
  telHref: string | null;
  merchantCode: string;
  merchantName: string;
  amount: number;
  reference: string;
  steps: string[];
}

export interface PaymentVerification {
  status: "pending" | "reported" | "confirmed";
}

export interface PaymentProvider {
  id: string;
  createPayment(request: PaymentRequest): PaymentInstructions;
  /** Automatic verification needs a gateway API. Manual providers always return "pending". */
  verifyPayment(reference: string): Promise<PaymentVerification>;
  /** Gateways call this with a signed webhook. Manual providers do not receive webhooks. */
  handleWebhook?(body: string, signature: string | null): Promise<void>;
}
