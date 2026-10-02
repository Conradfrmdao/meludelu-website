"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { normaliseUgPhone } from "@/lib/format";

export interface ReportState {
  status: "idle" | "done" | "error";
  message: string;
}

/** The customer tells us they've paid. It flags the order for the team; it does not mark it paid. */
export async function reportPayment(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const key = String(formData.get("key") ?? "");
  const reference = String(formData.get("reference") ?? "").trim().slice(0, 60);

  const rows = (await sql`
    update orders set payment_status = 'reported'
     where order_number = ${orderNumber} and access_key = ${key} and payment_status = 'pending' and status = 'pending_payment'
    returning id
  `) as { id: string }[];

  if (!rows[0]) {
    return { status: "error", message: "We couldn't update this order. It may already be confirmed. Please refresh." };
  }

  await sql`update payments set status = 'reported', provider_reference = ${reference || null} where order_id = ${rows[0].id}`;
  await sql`
    insert into order_status_history (order_id, status, note, changed_by)
    values (${rows[0].id}, 'pending_payment', ${reference ? `Customer reported payment, ref ${reference}` : "Customer reported payment"}, 'customer')
  `;
  revalidatePath(`/order/${orderNumber}`);
  return { status: "done", message: "Thank you. We'll check the payment and call you to confirm." };
}

export interface LookupState {
  error: string | null;
}

const lookupSchema = z.object({
  orderNumber: z.string().trim().toUpperCase().regex(/^MD\d{5,}$/, "Order numbers look like MD10001."),
  phone: z.string().trim().min(1, "Enter the phone number you used."),
});

export async function lookupOrder(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const parsed = lookupSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the details." };
  const phone = normaliseUgPhone(parsed.data.phone);
  if (!phone) return { error: "Enter the phone number you used, e.g. 0772 123 456." };

  const rows = (await sql`
    select access_key from orders where order_number = ${parsed.data.orderNumber} and customer_phone = ${phone}
  `) as { access_key: string }[];
  if (!rows[0]) return { error: "We couldn't find an order with those details." };
  redirect(`/order/${parsed.data.orderNumber}?key=${rows[0].access_key}`);
}
