import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { hashPassword, mapDbUser } from "@/lib/auth-user";
import { createAndSendVerificationEmail } from "@/lib/email-verification";

export async function POST(req: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const creator = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!creator || creator.role !== "SUPER_ADMIN" || creator.adminTier !== "PRIMARY") {
    return NextResponse.json(
      { error: "Only the primary platform admin can create sub-admins." },
      { status: 403 }
    );
  }

  try {
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
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        phone: phone?.trim() || null,
        role: "SUB_ADMIN",
        adminTier: "SUB",
        avatarUrl: avatarUrl || null,
        createdById: creator.id
      }
    });

    void createAndSendVerificationEmail(user.id, user.email, user.name);

    return NextResponse.json({
      user: mapDbUser(user),
      message: "Sub-admin created. They must verify their email before signing in."
    });
  } catch (e) {
    console.error("sub-admin", e);
    return NextResponse.json({ error: "Could not create sub-admin." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const creator = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!creator || creator.role !== "SUPER_ADMIN" || creator.adminTier !== "PRIMARY") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const subAdmins = await prisma.user.findMany({
    where: { createdById: creator.id, role: "SUB_ADMIN" },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ subAdmins: subAdmins.map(mapDbUser) });
}
