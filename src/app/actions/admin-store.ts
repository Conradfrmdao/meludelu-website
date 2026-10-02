"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export interface FormResult {
  ok: boolean;
  message: string;
}

const adjustSchema = z.object({
  variantId: z.uuid(),
  change: z.number().int().min(-10000).max(10000).refine((n) => n !== 0, "Enter a number other than 0"),
  reason: z.enum(["restock", "adjustment", "return"]),
  note: z.string().trim().max(300),
});

export async function adjustStock(_prev: FormResult | null, formData: FormData): Promise<FormResult> {
  const admin = await requireAdmin();
  const parsed = adjustSchema.safeParse({
    variantId: formData.get("variantId"),
    change: Number(formData.get("change")),
    reason: formData.get("reason"),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the numbers." };
  try {
    const rows = (await sql`
      select adjust_stock(${parsed.data.variantId}, ${parsed.data.change}, ${parsed.data.reason}, ${admin.name}, ${parsed.data.note || null}) as qty
    `) as { qty: number }[];
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { ok: true, message: `Now ${rows[0]?.qty ?? "updated"} in stock.` };
  } catch {
    return { ok: false, message: "Stock can't go below zero." };
  }
}

const mobileMoney = z.object({
  enabled: z.boolean(),
  label: z.string().trim().min(2).max(40),
  merchantCode: z.string().trim().max(30).regex(/^[0-9A-Za-z]*$/, "Merchant codes are letters and numbers only"),
  merchantName: z.string().trim().max(80),
  ussdTemplate: z
    .string()
    .trim()
    .regex(/^[*#0-9{}a-z]+$/, "Use only *, #, digits and {merchant} / {amount}")
    .refine((s) => s.startsWith("*") && s.endsWith("#"), "USSD codes start with * and end with #"),
});

const settingsSchema = z.object({
  payments: z.object({ mtn: mobileMoney, airtel: mobileMoney }),
  delivery: z.object({
    zones: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          label: z.string().trim().min(2).max(60),
          fee: z.number().int().min(0).max(1_000_000),
          eta: z.string().trim().min(2).max(60),
        }),
      )
      .min(1, "Keep at least one delivery area"),
    freeOver: z.number().int().min(0).nullable(),
    internationalLeadTime: z.string().trim().min(2).max(40),
  }),
  contact: z.object({
    whatsapp: z.string().trim().max(20).regex(/^[0-9+ ]*$/, "Digits only, e.g. 256772123456"),
    phone: z.string().trim().max(30),
    email: z.union([z.literal(""), z.email()]),
    city: z.string().trim().max(60),
  }),
});

export async function saveSettings(_prev: FormResult | null, formData: FormData): Promise<FormResult> {
  await requireAdmin("owner");
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { ok: false, message: "The form couldn't be read." };
  }
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, message: `${issue?.path.join(" › ")}: ${issue?.message}` };
  }
  const queries = Object.entries(parsed.data).map(
    ([key, value]) => sql`
      insert into store_settings (key, value) values (${key}, ${JSON.stringify(value)}::jsonb)
      on conflict (key) do update set value = excluded.value
    `,
  );
  await sql.transaction(queries);
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}

const staffSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(200),
  password: z.string().min(10, "Use at least 10 characters").max(200),
  role: z.enum(["staff", "owner"]),
});

export async function addTeamMember(_prev: FormResult | null, formData: FormData): Promise<FormResult> {
  await requireAdmin("owner");
  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  const hash = await bcrypt.hash(parsed.data.password, 12);
  const rows = (await sql`
    insert into admin_users (email, name, password_hash, role)
    values (${parsed.data.email}, ${parsed.data.name}, ${hash}, ${parsed.data.role})
    on conflict (email) do nothing returning id
  `) as { id: string }[];
  if (!rows[0]) return { ok: false, message: "Someone with that email already has access." };
  revalidatePath("/admin/settings");
  return { ok: true, message: `${parsed.data.name} can now sign in.` };
}

export async function setTeamMemberActive(formData: FormData) {
  const admin = await requireAdmin("owner");
  const id = z.uuid().parse(formData.get("id"));
  const active = formData.get("active") === "true";
  if (id === admin.id) return;
  await sql`update admin_users set is_active = ${active} where id = ${id}`;
  revalidatePath("/admin/settings");
}

export async function changePassword(_prev: FormResult | null, formData: FormData): Promise<FormResult> {
  const admin = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 10) return { ok: false, message: "Use at least 10 characters for the new password." };
  const rows = (await sql`select password_hash from admin_users where id = ${admin.id}`) as { password_hash: string }[];
  if (!rows[0] || !(await bcrypt.compare(current, rows[0].password_hash))) {
    return { ok: false, message: "Your current password isn't right." };
  }
  await sql`update admin_users set password_hash = ${await bcrypt.hash(next, 12)} where id = ${admin.id}`;
  return { ok: true, message: "Password changed." };
}
