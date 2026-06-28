import { NextResponse } from "next/server";
import type { User } from "@/generated/prisma/client";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  type SessionPayload
} from "@/lib/auth-session";
import { mapDbUser } from "@/lib/auth-user";
import type { AuthUser } from "@/types/auth";

type UserWithShop = User & { shop?: { id: string } | null };

export async function createAuthResponse(
  user: UserWithShop,
  extra?: Record<string, unknown>
) {
  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    email: user.email
  };
  const token = await createSessionToken(payload);
  const body = { user: mapDbUser(user), ...extra };
  const response = NextResponse.json(body);
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

export function authUserResponse(user: AuthUser, extra?: Record<string, unknown>) {
  return NextResponse.json({ user, ...extra });
}
