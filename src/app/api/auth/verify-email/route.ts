import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getSessionFromCookies, setSessionCookie } from "@/lib/auth";
import { mapDbUser } from "@/lib/auth-user";
import { hashToken } from "@/lib/tokens";
import { welcomeEmail, sendEmail } from "@/lib/email";
import { getAppBaseUrl } from "@/lib/tokens";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ valid: false, error: "Missing verification token." }, { status: 400 });
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { shop: true } } }
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({
      valid: false,
      error: "This verification link is invalid or has expired."
    });
  }

  if (record.user.emailVerifiedAt) {
    return NextResponse.json({ valid: true, alreadyVerified: true, email: record.user.email });
  }

  const now = new Date();
  const user = await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: now }
    });
    await tx.emailVerificationToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: now }
    });
    return tx.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: now },
      include: { shop: true }
    });
  });

  const welcome = welcomeEmail(user.name, `${getAppBaseUrl()}/auth/login`);
  void sendEmail({
    to: user.email,
    subject: welcome.subject,
    html: welcome.html,
    text: welcome.text
  });

  const session = await getSessionFromCookies();
  if (session?.userId === user.id) {
    return NextResponse.json({ valid: true, user: mapDbUser(user), signedIn: true });
  }

  const sessionToken = await createSessionToken({
    userId: user.id,
    role: user.role,
    email: user.email
  });
  await setSessionCookie(sessionToken);

  return NextResponse.json({ valid: true, user: mapDbUser(user), signedIn: true });
}
