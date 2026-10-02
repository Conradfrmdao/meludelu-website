"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { OrderStatus } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  message: string;
}

const STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "ordered_from_supplier",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const satisfies readonly OrderStatus[];

const statusSchema = z.object({
  orderNumber: z.string().regex(/^MD\d{5,}$/),
  status: z.enum(STATUSES),
  note: z.string().trim().max(500).optional(),
});

const errorText: Record<string, string> = {
  ORDER_CLOSED: "This order is closed (cancelled or refunded) and can't be reopened.",
  ORDER_NOT_FOUND: "Order not found.",
};

function refresh(orderNumber: string) {
  revalidatePath("/admin", "layout");
  revalidatePath(`/order/${orderNumber}`);
  // Cancelling returns stock, which changes what the shop shows.
  revalidatePath("/", "layout");
}

export async function updateOrderStatus(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = statusSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "Choose a valid status." };

  try {
    await sql`
      select set_order_status(
        (select id from orders where order_number = ${parsed.data.orderNumber}),
        ${parsed.data.status}, ${admin.name}, ${parsed.data.note ?? null}
      )
    `;
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return { ok: false, message: errorText[code] ?? "Couldn't update the order. Please try again." };
  }
  refresh(parsed.data.orderNumber);
  return { ok: true, message: "Order updated." };
}

export async function saveInternalNote(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const note = String(formData.get("internalNotes") ?? "").slice(0, 2000);
  await sql`update orders set internal_notes = ${note || null} where order_number = ${orderNumber}`;
  revalidatePath(`/admin/orders/${orderNumber}`);
  return { ok: true, message: "Note saved." };
}
