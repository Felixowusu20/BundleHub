import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-user";
import { hashResetToken } from "@/lib/password-reset";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body as { token?: string; password?: string };

    if (!token?.trim()) {
      return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const tokenHash = hashResetToken(token.trim());
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: now }
      }),
      prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: now }
      })
    ]);

    return NextResponse.json({
      message: "Password updated. You can sign in with your new password."
    });
  } catch (e) {
    console.error("reset-password", e);
    return NextResponse.json({ error: "Could not reset password." }, { status: 500 });
  }
}
