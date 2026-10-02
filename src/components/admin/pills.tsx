import { orderStatusLabels, paymentStatusLabels } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

const orderTone: Record<OrderStatus, string> = {
  pending_payment: "bg-warning-soft text-warning",
  paid: "bg-success-soft text-success",
  processing: "bg-blush-soft text-ink-soft",
  ordered_from_supplier: "bg-blush-soft text-ink-soft",
  shipped: "bg-cream text-ink-soft",
  delivered: "bg-cream text-muted",
  cancelled: "bg-danger-soft text-danger",
  refunded: "bg-danger-soft text-danger",
};

const paymentTone: Record<PaymentStatus, string> = {
  pending: "bg-cream text-muted",
  reported: "bg-warning-soft text-warning",
  confirmed: "bg-success-soft text-success",
  refunded: "bg-danger-soft text-danger",
};

const pill = "inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium";

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <span className={`${pill} ${orderTone[status]}`}>{orderStatusLabels[status]}</span>;
}

export function PaymentPill({ status }: { status: PaymentStatus }) {
  return <span className={`${pill} ${paymentTone[status]}`}>{paymentStatusLabels[status]}</span>;
}
