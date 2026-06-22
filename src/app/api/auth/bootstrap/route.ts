import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { hashPassword, mapDbUser } from "@/lib/auth-user";

export async function POST(req: Request) {
  try {
    const existing = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN", adminTier: "PRIMARY" }
    });
    if (existing) {
      return NextResponse.json(
        { error: "Platform admin already exists. Sign in instead." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, phone, avatarUrl } = body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      avatarUrl?: string;
    };

    if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Name, email, and password (min 8 chars) are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const taken = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (taken) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        phone: phone?.trim() || null,
        role: "SUPER_ADMIN",
        adminTier: "PRIMARY",
        avatarUrl: avatarUrl || null,
        emailVerifiedAt: new Date()
      }
    });

    const token = await createSessionToken({
      userId: user.id,
      role: user.role,
      email: user.email
    });
    await setSessionCookie(token);

    return NextResponse.json({ user: mapDbUser(user) });
  } catch (e) {
    console.error("bootstrap admin", e);
    return NextResponse.json({ error: "Could not create admin account." }, { status: 500 });
  }
}
