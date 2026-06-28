import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuthResponse } from "@/lib/auth-response";
import { mapDbUser, verifyPasswordSafe } from "@/lib/auth-user";

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  city: true,
  role: true,
  adminTier: true,
  avatarUrl: true,
  createdAt: true,
  walletBalance: true,
  loyaltyLevel: true,
  emailVerifiedAt: true,
  passwordHash: true,
  shop: { select: { id: true } }
} as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: userSelect
    });

    if (!user || !(await verifyPasswordSafe(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        {
          error: "Please verify your email before signing in.",
          needsEmailVerification: true,
          email: user.email
        },
        { status: 403 }
      );
    }

    return createAuthResponse(user);
  } catch (e) {
    console.error("login", e);
    return NextResponse.json({ error: "Sign in failed." }, { status: 500 });
  }
}
