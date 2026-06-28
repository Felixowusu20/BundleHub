import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken, getAppBaseUrl } from "@/lib/tokens";
import { welcomeEmail, sendEmail } from "@/lib/email";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ valid: false, error: "Missing verification token." }, { status: 400 });
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({
      valid: false,
      error: "This verification link is invalid or has expired."
    });
  }

  if (record.user.emailVerifiedAt) {
    return NextResponse.json({
      valid: true,
      alreadyVerified: true,
      email: record.user.email
    });
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
      data: { emailVerifiedAt: now }
    });
  });

  const welcome = welcomeEmail(user.name, `${getAppBaseUrl()}/auth/login?verified=1&email=${encodeURIComponent(user.email)}`);
  void sendEmail({
    to: user.email,
    subject: welcome.subject,
    html: welcome.html,
    text: welcome.text
  });

  return NextResponse.json({
    valid: true,
    email: user.email
  });
}
