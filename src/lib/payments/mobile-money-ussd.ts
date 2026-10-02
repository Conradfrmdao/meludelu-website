import type { MobileMoneySettings } from "../settings";
import type { PaymentInstructions, PaymentProvider, PaymentRequest } from "./provider";

/** Fills {merchant} and {amount} into a USSD template such as "*165*3*{merchant}*{amount}#". */
export function buildDialString(template: string, merchantCode: string, amount: number): string {
  return template.replaceAll("{merchant}", merchantCode).replaceAll("{amount}", String(amount)).replace(/\s+/g, "");
}

/** "#" must be escaped as %23 in a tel: link or the dialler drops everything after it. */
export function toTelHref(dialString: string): string {
  return `tel:${dialString.replaceAll("#", "%23")}`;
}

export function createMobileMoneyUssdProvider(config: MobileMoneySettings): PaymentProvider {
  return {
    id: "mobile-money-ussd",

    createPayment(request: PaymentRequest): PaymentInstructions {
      const ready = config.enabled && config.merchantCode.trim() !== "";
      const dialString = ready ? buildDialString(config.ussdTemplate, config.merchantCode.trim(), request.amount) : "";
      const templateHasMerchant = config.ussdTemplate.includes("{merchant}");
      const templateHasAmount = config.ussdTemplate.includes("{amount}");

      const steps = ready
        ? [
            `Tap the button to open your dialler with ${dialString}, then press call.`,
            ...(templateHasMerchant ? [] : [`Enter merchant code ${config.merchantCode} when asked.`]),
            ...(templateHasAmount ? [] : [`Enter the amount: ${request.amount}.`]),
            `If asked for a reference, use ${request.orderNumber}.`,
            "Confirm with your Mobile Money PIN.",
          ]
        : [];

      return {
        kind: ready ? "ussd" : "manual",
        label: config.label,
        dialString,
        telHref: ready ? toTelHref(dialString) : null,
        merchantCode: config.merchantCode,
        merchantName: config.merchantName,
        amount: request.amount,
        reference: request.orderNumber,
        steps,
      };
    },

    async verifyPayment() {
      return { status: "pending" };
    },
  };
}
