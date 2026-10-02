"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, type AdminUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export interface LoginState {
  error: string | null;
  email: string;
}

const schema = z.object({ email: z.email().max(200), password: z.string().min(1).max(200) });

const MAX_FAILURES = 5;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = schema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { error: "Enter your email and password.", email };

  const recent = (await sql`
    select count(*)::int as n from login_attempts
     where email = ${email} and not success and created_at > now() - interval '15 minutes'
  `) as { n: number }[];
  if ((recent[0]?.n ?? 0) >= MAX_FAILURES) {
    return { error: "Too many attempts. Please wait 15 minutes and try again.", email };
  }

  const rows = (await sql`
    select id, email, name, role, password_hash from admin_users where email = ${email} and is_active
  `) as (AdminUser & { password_hash: string })[];
  const user = rows[0];
  // Compare against a dummy hash when the user doesn't exist, so timing doesn't reveal valid emails.
  const ok = await bcrypt.compare(
    parsed.data.password,
    user?.password_hash ?? "$2b$12$mUH1Io/PVUDhSPrnVutqR.3qcMqUDCxkuvMBFq5FY3qfYSuOVnSGC",
  );

  await sql`insert into login_attempts (email, success) values (${email}, ${ok && !!user})`;
  if (!ok || !user) return { error: "That email and password don't match.", email };

  await sql`update admin_users set last_login_at = now() where id = ${user.id}`;
  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
