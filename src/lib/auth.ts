import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { sql } from "./db";
import { SESSION_COOKIE, signSession, verifySession, type AdminRole } from "./session";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

const SESSION_DAYS = 7;

export async function createSession(user: AdminUser) {
  const token = await signSession({ sub: user.id, role: user.role }, SESSION_DAYS);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** The signed-in admin, re-checked against the database on every request. */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const store = await cookies();
  const payload = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const rows = (await sql`
    select id, email, name, role from admin_users where id = ${payload.sub} and is_active
  `) as AdminUser[];
  return rows[0] ?? null;
});

export async function requireAdmin(role?: AdminRole): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (role === "owner" && admin.role !== "owner") redirect("/admin?denied=1");
  return admin;
}
