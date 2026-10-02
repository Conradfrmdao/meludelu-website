"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getProductsByVariantIds } from "@/lib/catalog";
import { sql } from "@/lib/db";
import { normaliseUgPhone } from "@/lib/format";
import { deliveryFeeFor, getSettings } from "@/lib/settings";
import type { StockStatus } from "@/lib/types";

export interface FreshLine {
  variantId: string;
  available: boolean;
  price: number;
  stockStatus: StockStatus;
  maxQuantity: number | null;
}

/** Re-reads price and availability for the lines in a browser cart. */
export async function refreshCart(variantIds: string[]): Promise<FreshLine[]> {
  const ids = variantIds.filter((id) => z.uuid().safeParse(id).success).slice(0, 50);
  const products = await getProductsByVariantIds(ids);
  const byId = new Map(products.flatMap((p) => p.variants.map((v) => [v.id, v] as const)));
  return ids.map((id) => {
    const v = byId.get(id);
    return v
      ? { variantId: id, available: v.stockStatus !== "out_of_stock", price: v.price, stockStatus: v.stockStatus, maxQuantity: v.maxQuantity }
      : { variantId: id, available: false, price: 0, stockStatus: "out_of_stock", maxQuantity: 0 };
  });
}

export interface CheckoutValues {
  name: string;
  phone: string;
  email: string;
  zone: string;
  address: string;
  cityArea: string;
  notes: string;
  payment: string;
}

export interface CheckoutState {
  errors: Partial<Record<keyof CheckoutValues | "items" | "leadTime" | "form", string>>;
  values: CheckoutValues;
}

const itemsSchema = z
  .array(z.object({ variantId: z.uuid(), quantity: z.number().int().min(1).max(20) }))
  .min(1, "Your bag is empty.")
  .max(50);

const formSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(120),
  phone: z.string().trim().min(1, "We need a phone number to confirm your order."),
  email: z.union([z.literal(""), z.email("That email doesn't look right.").max(200)]),
  zone: z.string().min(1, "Choose a delivery area."),
  address: z.string().trim().min(3, "Tell us where to deliver: street, building or a landmark.").max(300),
  cityArea: z.string().trim().min(2, "Which town or area?").max(120),
  notes: z.string().trim().max(500),
  payment: z.enum(["mtn", "airtel"], { message: "Choose how you'll pay." }),
});

const friendlyErrors: Record<string, string> = {
  EMPTY_CART: "Your bag is empty.",
  INVALID_QUANTITY: "One of the quantities in your bag isn't valid. Please check your bag.",
};

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const values: CheckoutValues = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    zone: String(formData.get("zone") ?? ""),
    address: String(formData.get("address") ?? ""),
    cityArea: String(formData.get("cityArea") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    payment: String(formData.get("payment") ?? ""),
  };
  const errors: CheckoutState["errors"] = {};

  const parsed = formSchema.safeParse(values);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof CheckoutValues;
      errors[key] ??= issue.message;
    }
  }

  const phone = normaliseUgPhone(values.phone);
  if (values.phone && !phone) errors.phone = "Enter an MTN or Airtel number, e.g. 0772 123 456.";

  let items: z.infer<typeof itemsSchema> = [];
  try {
    const result = itemsSchema.safeParse(JSON.parse(String(formData.get("items") ?? "[]")));
    if (result.success) items = result.data;
    else errors.items = "Your bag is empty.";
  } catch {
    errors.items = "We couldn't read your bag. Please refresh the page.";
  }

  const settings = await getSettings();
  const fresh = items.length ? await refreshCart(items.map((i) => i.variantId)) : [];
  const hasExternal = fresh.some((f) => f.stockStatus === "ships_from_china" || f.stockStatus === "available_to_order");
  if (hasExternal && formData.get("leadTimeOk") !== "on") {
    errors.leadTime = "Please confirm you're happy to wait for the pieces we order in.";
  }

  if (Object.keys(errors).length || !parsed.success || !phone) {
    return { errors, values };
  }

  // Merge duplicate lines so stock checks see the true quantity.
  const merged = new Map<string, number>();
  for (const i of items) merged.set(i.variantId, Math.min((merged.get(i.variantId) ?? 0) + i.quantity, 20));
  const lines = [...merged].map(([variantId, quantity]) => ({ variantId, quantity }));

  const subtotal = lines.reduce((sum, l) => sum + (fresh.find((f) => f.variantId === l.variantId)?.price ?? 0) * l.quantity, 0);
  const shippingFee = deliveryFeeFor(settings, parsed.data.zone, subtotal);
  if (shippingFee === null) return { errors: { zone: "Choose a delivery area." }, values };
  const zone = settings.delivery.zones.find((z) => z.id === parsed.data.zone)!;

  // Basic rate limit: a handful of orders per phone number in ten minutes.
  const recent = (await sql`
    select count(*)::int as n from orders where customer_phone = ${phone} and created_at > now() - interval '10 minutes'
  `) as { n: number }[];
  if ((recent[0]?.n ?? 0) >= 4) {
    return { errors: { form: "You've placed several orders in the last few minutes. Please wait a little, or message us." }, values };
  }

  let order: { order_number: string; access_key: string } | undefined;
  try {
    const rows = (await sql`
      select order_number, access_key from place_order(
        ${JSON.stringify({ name: parsed.data.name, phone, email: parsed.data.email })}::jsonb,
        ${JSON.stringify({ zone: zone.label, address: parsed.data.address, cityArea: parsed.data.cityArea, notes: parsed.data.notes })}::jsonb,
        ${JSON.stringify(lines)}::jsonb,
        ${parsed.data.payment},
        ${shippingFee}
      )
    `) as { order_number: string; access_key: string }[];
    order = rows[0];
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const [code, detail] = message.split(":");
    if (code === "OUT_OF_STOCK") {
      return { errors: { items: `${detail?.trim() ?? "An item"} has just sold out in your size. Please update your bag.` }, values };
    }
    if (code === "UNAVAILABLE") {
      return { errors: { items: `${detail?.trim() ?? "An item"} is no longer available. Please remove it from your bag.` }, values };
    }
    if (friendlyErrors[code]) return { errors: { items: friendlyErrors[code] }, values };
    console.error("place_order failed", error);
    return { errors: { form: "Something went wrong on our side and your order was not placed. Please try again." }, values };
  }

  if (!order) {
    return { errors: { form: "Something went wrong on our side and your order was not placed. Please try again." }, values };
  }
  redirect(`/order/${order.order_number}?key=${order.access_key}&placed=1`);
}
