// Session token helpers. Kept free of database and Node-only imports so proxy.ts can use them.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "md_admin";

export type AdminRole = "owner" | "staff";

export interface SessionPayload {
  sub: string;
  role: AdminRole;
}

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload, days: number): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    const role = payload.role === "owner" ? "owner" : "staff";
    return { sub: payload.sub, role };
  } catch {
    return null;
  }
}
