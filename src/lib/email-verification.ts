import { prisma } from "@/lib/prisma";
import { emailVerificationEmail, sendEmail } from "@/lib/email";
import { generateSecureToken, getAppBaseUrl, tokenExpiresAt } from "@/lib/tokens";

export function buildVerifyEmailUrl(token: string): string {
  return `${getAppBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export async function createAndSendVerificationEmail(
  userId: string,
  email: string,
  name: string
): Promise<{ ok: true; devVerifyUrl?: string } | { ok: false; error: string }> {
  await prisma.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() }
  });

  const { token, tokenHash } = generateSecureToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: tokenExpiresAt(24)
    }
  });

  const verifyUrl = buildVerifyEmailUrl(token);
  const mail = emailVerificationEmail(name, verifyUrl);
  const sent = await sendEmail({
    to: email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text
  });

  const isDev = process.env.NODE_ENV === "development";

  if (!sent.ok) {
    if (isDev) {
      return { ok: true, devVerifyUrl: verifyUrl };
    }
    return { ok: false, error: sent.error };
  }

  return isDev ? { ok: true, devVerifyUrl: verifyUrl } : { ok: true };
}
