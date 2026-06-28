import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/generated/prisma/client";
import type { AccountRole } from "@/types/auth";

export const SESSION_COOKIE = "bundlehub_session";
export const SESSION_DAYS = 30;

export type SessionPayload = {
  userId: string;
  role: UserRole;
  email: string;
};

function getSecret() {
  const secret =
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "bundlehub-dev-auth-secret-change-in-production"
      : undefined);
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

export function toAppRole(role: UserRole): AccountRole {
  switch (role) {
    case "SUPER_ADMIN":
    case "SUB_ADMIN":
      return "super_admin";
    case "SHOP_OWNER":
      return "shop_owner";
    case "SHOP_STAFF":
      return "shop_staff";
    default:
      return "customer";
  }
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.userId as string;
    const role = payload.role as UserRole;
    const email = payload.email as string;
    if (!userId || !role || !email) return null;
    return { userId, role, email };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60
  };
}
