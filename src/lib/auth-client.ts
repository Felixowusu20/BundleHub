import type { AuthUser } from "@/types/auth";

export const ROLE_DASHBOARD: Record<string, string> = {
  customer: "/app/customer",
  shop_owner: "/app/shop_owner",
  shop_staff: "/app/shop_staff",
  super_admin: "/app/super_admin"
};

export const DEV_VERIFY_URL_KEY = "bundlehub_dev_verify_url";
export const PENDING_LOGIN_KEY = "bundlehub_pending_login";

export function dashboardPathForRole(role: string): string {
  return ROLE_DASHBOARD[role] ?? "/app";
}

export function storeDevVerifyUrl(url: string | undefined) {
  if (!url || typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(DEV_VERIFY_URL_KEY, url);
}

export function consumeDevVerifyUrl(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const url = sessionStorage.getItem(DEV_VERIFY_URL_KEY);
  if (url) sessionStorage.removeItem(DEV_VERIFY_URL_KEY);
  return url;
}

/** Temporarily holds password so login can run right after email verification. */
export function storePendingLogin(email: string, password: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(
    PENDING_LOGIN_KEY,
    JSON.stringify({ email: email.trim().toLowerCase(), password })
  );
}

export function consumePendingLogin(email: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_LOGIN_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PENDING_LOGIN_KEY);
  try {
    const parsed = JSON.parse(raw) as { email?: string; password?: string };
    if (parsed.email?.toLowerCase() === email.trim().toLowerCase() && parsed.password) {
      return parsed.password;
    }
  } catch {
    /* ignore malformed storage */
  }
  return null;
}

export type AuthFetchResult = {
  ok: boolean;
  user?: AuthUser;
  error?: string;
  needsEmailVerification?: boolean;
  email?: string;
  devVerifyUrl?: string;
};

export async function postAuth(
  path: string,
  body: Record<string, unknown>
): Promise<AuthFetchResult & Record<string, unknown>> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
  const data = (await res.json()) as AuthFetchResult & Record<string, unknown>;
  return { ...data, ok: res.ok };
}
