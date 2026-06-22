import { generateSecureToken, getAppBaseUrl, hashToken, tokenExpiresAt } from "@/lib/tokens";

export function generateResetToken() {
  const { token, tokenHash } = generateSecureToken();
  return { token, tokenHash, expiresAt: tokenExpiresAt(1) };
}

export function hashResetToken(token: string): string {
  return hashToken(token);
}

export function buildResetPasswordUrl(token: string): string {
  return `${getAppBaseUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;
}

export { getAppBaseUrl } from "@/lib/tokens";
