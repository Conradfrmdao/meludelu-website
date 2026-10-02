import type { OrderStatus, PaymentStatus, StockStatus } from "./types";

const ugx = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 });

/** 145000 -> "UGX 145,000" */
export function formatUGX(amount: number): string {
  return `UGX ${ugx.format(amount)}`;
}

export function discountPercent(price: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export const stockLabels: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Sold out",
  available_to_order: "Made to order",
  ships_from_china: "Ships from abroad",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  processing: "Preparing",
  ordered_from_supplier: "Ordered from supplier",
  shipped: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Not yet paid",
  reported: "Customer says paid",
  confirmed: "Confirmed",
  refunded: "Refunded",
};

export function formatDate(value: string | Date, withTime = false): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Africa/Kampala",
  }).format(date);
}

/** Normalises Ugandan phone numbers to 2567XXXXXXXX. Returns null if it doesn't look valid. */
export function normaliseUgPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local: string | null = null;
  if (digits.length === 10 && digits.startsWith("0")) local = digits.slice(1);
  else if (digits.length === 12 && digits.startsWith("256")) local = digits.slice(3);
  else if (digits.length === 9) local = digits;
  if (!local || !/^7\d{8}$/.test(local)) return null;
  return `256${local}`;
}

/** 256772123456 -> "0772 123 456" */
export function displayPhone(phone: string): string {
  const local = phone.startsWith("256") ? `0${phone.slice(3)}` : phone;
  return local.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
}
