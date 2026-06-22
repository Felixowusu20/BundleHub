import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getSessionFromCookies,
  setSessionCookie
} from "@/lib/auth";
import { hashPassword, mapDbUser, verifyPassword } from "@/lib/auth-user";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { shop: true }
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
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

    const token = await createSessionToken({
      userId: user.id,
      role: user.role,
      email: user.email
    });
    await setSessionCookie(token);

    return NextResponse.json({ user: mapDbUser(user) });
  } catch (e) {
    console.error("login", e);
    return NextResponse.json({ error: "Sign in failed." }, { status: 500 });
  }
}
