import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
  type SessionPayload
} from "@/lib/auth-session";

export {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_DAYS,
  sessionCookieOptions,
  toAppRole,
  verifySessionToken,
  type SessionPayload
} from "@/lib/auth-session";

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
