import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-user";
import { createAndSendVerificationEmail } from "@/lib/email-verification";

type RegisterBody = {
  type?: "customer" | "shop_owner";
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  city?: string;
  shopName?: string;
  shopDescription?: string;
  avatarUrl?: string;
};

async function sendVerification(userId: string, email: string, name: string) {
  try {
    return await createAndSendVerificationEmail(userId, email, name);
  } catch (e) {
    console.error("verification email", e);
    return { ok: false as const, error: "Could not send verification email." };
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody;
    const { type, name, email, password, phone, city, shopName, shopDescription, avatarUrl } =
      body;

    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Name, email, and password (min 6 chars) are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    if (type === "shop_owner") {
      if (!shopName?.trim() || !phone?.trim() || !city?.trim()) {
        return NextResponse.json(
          { error: "Shop name, phone, and city are required for shop owners." },
          { status: 400 }
        );
      }

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          phone: phone.trim(),
          city: city.trim(),
          role: "SHOP_OWNER",
          avatarUrl: avatarUrl || null,
          shop: {
            create: {
              name: shopName.trim(),
              description: shopDescription?.trim() || null,
              phone: phone.trim(),
              city: city.trim(),
              status: "PENDING",
              badges: ["New Seller"],
              verification: []
            }
          }
        }
      });

      const mail = await sendVerification(user.id, user.email, user.name);

      return NextResponse.json({
        message: mail.ok
          ? "Account created. Check your email to verify before signing in."
          : "Account created. Use resend below if you did not receive the verification email.",
        email: user.email,
        devVerifyUrl: mail.ok ? mail.devVerifyUrl : undefined,
        emailSent: mail.ok
      });
    }

    if (!phone?.trim() || !city?.trim()) {
      return NextResponse.json({ error: "Phone and city are required." }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: phone.trim(),
        city: city.trim(),
        role: "CUSTOMER",
        avatarUrl: avatarUrl || null
      }
    });

    const mail = await sendVerification(user.id, user.email, user.name);

    return NextResponse.json({
      message: mail.ok
        ? "Account created. Check your email to verify before signing in."
        : "Account created. Use resend below if you did not receive the verification email.",
      email: user.email,
      devVerifyUrl: mail.ok ? mail.devVerifyUrl : undefined,
      emailSent: mail.ok
    });
  } catch (e) {
    console.error("register", e);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
