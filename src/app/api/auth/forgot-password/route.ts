import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { passwordResetEmail, sendEmail } from "@/lib/email";
import { buildResetPasswordUrl, generateResetToken } from "@/lib/password-reset";

const GENERIC_OK = {
  message:
    "If an account exists for that email, we sent password reset instructions. Check your inbox."
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body as { email?: string }).email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() }
      });

      const { token, tokenHash, expiresAt } = generateResetToken();
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt }
      });

      const resetUrl = buildResetPasswordUrl(token);
      const mail = passwordResetEmail(user.name, resetUrl);
      const sent = await sendEmail({
        to: user.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text
      });

      if (!sent.ok) {
        console.error("forgot-password email:", sent.error);
        if (process.env.NODE_ENV === "development") {
          return NextResponse.json({ ...GENERIC_OK, devResetUrl: resetUrl, emailError: sent.error });
        }
      }
    }

    return NextResponse.json(GENERIC_OK);
  } catch (e) {
    console.error("forgot-password", e);
    return NextResponse.json({ error: "Could not process request." }, { status: 500 });
  }
}
