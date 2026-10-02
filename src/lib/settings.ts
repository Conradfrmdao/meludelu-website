import "server-only";
import { cache } from "react";
import { sql } from "./db";

export interface MobileMoneySettings {
  enabled: boolean;
  label: string;
  merchantCode: string;
  merchantName: string;
  /** USSD string to dial. {merchant} and {amount} are filled in for each order. */
  ussdTemplate: string;
}

export interface DeliveryZone {
  id: string;
  label: string;
  fee: number;
  eta: string;
}

export interface StoreSettings {
  payments: { mtn: MobileMoneySettings; airtel: MobileMoneySettings };
  delivery: { zones: DeliveryZone[]; freeOver: number | null; internationalLeadTime: string };
  contact: { whatsapp: string; phone: string; email: string; city: string };
}

const defaults: StoreSettings = {
  payments: {
    mtn: { enabled: true, label: "MTN Mobile Money", merchantCode: "", merchantName: "", ussdTemplate: "*165*3#" },
    airtel: { enabled: true, label: "Airtel Money", merchantCode: "", merchantName: "", ussdTemplate: "*185*9#" },
  },
  delivery: {
    zones: [{ id: "kampala", label: "Kampala", fee: 10000, eta: "1–2 working days" }],
    freeOver: null,
    internationalLeadTime: "14–21 days",
  },
  contact: { whatsapp: "", phone: "", email: "", city: "Kampala" },
};

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const rows = (await sql`select key, value from store_settings`) as { key: string; value: unknown }[];
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<StoreSettings>;
  return {
    payments: {
      mtn: { ...defaults.payments.mtn, ...stored.payments?.mtn },
      airtel: { ...defaults.payments.airtel, ...stored.payments?.airtel },
    },
    delivery: { ...defaults.delivery, ...stored.delivery },
    contact: { ...defaults.contact, ...stored.contact },
  };
});

export function deliveryFeeFor(settings: StoreSettings, zoneId: string, subtotal: number): number | null {
  const zone = settings.delivery.zones.find((z) => z.id === zoneId);
  if (!zone) return null;
  if (settings.delivery.freeOver && subtotal >= settings.delivery.freeOver) return 0;
  return zone.fee;
}
