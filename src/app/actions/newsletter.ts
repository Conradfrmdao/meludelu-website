"use server";

import { z } from "zod";
import { sql } from "@/lib/db";

export interface NewsletterState {
  status: "idle" | "success" | "error";
  message: string;
}

const schema = z.object({ email: z.email().max(200) });

export async function subscribe(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const parsed = schema.safeParse({ email: String(formData.get("email") ?? "").trim().toLowerCase() });
  if (!parsed.success) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  await sql`insert into newsletter_subscribers (email) values (${parsed.data.email}) on conflict (email) do nothing`;
  return { status: "success", message: "Thank you. You're on the list." };
}
