"use client";

import { useActionState, useState } from "react";
import { type ActionResult, saveInternalNote, updateOrderStatus } from "@/app/actions/admin-orders";
import { Button } from "@/components/ui/button";
import { orderStatusLabels } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

function nextStep(status: OrderStatus, external: boolean): { status: OrderStatus; label: string } | null {
  switch (status) {
    case "pending_payment":
      return { status: "paid", label: "Confirm payment received" };
    case "paid":
      return external
        ? { status: "ordered_from_supplier", label: "Mark as ordered from supplier" }
        : { status: "processing", label: "Start preparing" };
    case "ordered_from_supplier":
      return { status: "processing", label: "Items arrived, preparing" };
    case "processing":
      return { status: "shipped", label: "Mark out for delivery" };
    case "shipped":
      return { status: "delivered", label: "Mark delivered" };
    default:
      return null;
  }
}

const ALL: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "ordered_from_supplier",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export function OrderActions({
  orderNumber,
  status,
  paymentStatus,
  hasExternalItems,
}: {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  hasExternalItems: boolean;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updateOrderStatus, null);
  const [other, setOther] = useState<OrderStatus | "">("");
  const step = nextStep(status, hasExternalItems);
  const closed = status === "cancelled" || status === "refunded";

  const confirmFor = (target: string) => {
    if (target === "cancelled") return "Cancel this order? Stocked items go back on the shelf.";
    if (target === "refunded") return "Mark as refunded? Make sure the money has been sent back first.";
    return null;
  };

  return (
    <div className="space-y-4">
      {step && (
        <form
          action={action}
          onSubmit={(e) => {
            if (step.status === "paid" && paymentStatus !== "reported" && !window.confirm("The customer hasn't told us they've paid. Confirm anyway?")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="orderNumber" value={orderNumber} />
          <input type="hidden" name="status" value={step.status} />
          {step.status === "paid" && (
            <p className="mb-3 text-[13.5px] leading-relaxed text-muted">
              Only confirm once you can see the money in your merchant account.
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Saving…" : step.label}
          </Button>
        </form>
      )}

      {!closed && (
        <form
          action={action}
          className="space-y-2.5 border-t border-line pt-4"
          onSubmit={(e) => {
            const message = confirmFor(other);
            if (message && !window.confirm(message)) e.preventDefault();
          }}
        >
          <input type="hidden" name="orderNumber" value={orderNumber} />
          <label htmlFor="status-other" className="block text-[13px] text-ink-soft">
            Or set a different status
          </label>
          <div className="flex gap-2">
            <select
              id="status-other"
              name="status"
              value={other}
              onChange={(e) => setOther(e.target.value as OrderStatus)}
              className="h-10 min-w-0 flex-1 rounded-full border border-line bg-white px-3 text-[14px]"
            >
              <option value="">Choose…</option>
              {ALL.filter((s) => s !== status).map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabels[s]}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary" disabled={!other || pending}>
              Update
            </Button>
          </div>
          <label htmlFor="status-note" className="sr-only">
            Note
          </label>
          <input
            id="status-note"
            name="note"
            placeholder="Note for the timeline (optional)"
            maxLength={500}
            className="h-10 w-full rounded-full border border-line bg-white px-4 text-[13.5px]"
          />
        </form>
      )}

      {status === "cancelled" && (
        <form action={action} onSubmit={(e) => !window.confirm(confirmFor("refunded")!) && e.preventDefault()}>
          <input type="hidden" name="orderNumber" value={orderNumber} />
          <input type="hidden" name="status" value="refunded" />
          <Button type="submit" variant="secondary" className="w-full" disabled={pending}>
            Mark as refunded
          </Button>
        </form>
      )}

      {state && (
        <p role="status" className={`text-[13.5px] ${state.ok ? "text-success" : "text-danger"}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}

export function InternalNoteForm({ orderNumber, value }: { orderNumber: string; value: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveInternalNote, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <label htmlFor="internalNotes" className="sr-only">
        Internal notes
      </label>
      <textarea
        id="internalNotes"
        name="internalNotes"
        defaultValue={value}
        rows={3}
        placeholder="Only the team sees this"
        className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-[14px] focus:border-charcoal focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          Save note
        </Button>
        {state && <span className="text-[13px] text-muted">{state.message}</span>}
      </div>
    </form>
  );
}
