import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/password-reset";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ valid: false, error: "Missing reset token." }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    include: { user: { select: { email: true, name: true } } }
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({
      valid: false,
      error: "This reset link is invalid or has expired."
    });
  }

  return NextResponse.json({
    valid: true,
    email: record.user.email,
    name: record.user.name
  });
}
