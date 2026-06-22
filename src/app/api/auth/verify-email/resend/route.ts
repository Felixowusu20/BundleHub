import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSendVerificationEmail } from "@/lib/email-verification";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body as { email?: string }).email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({
        message: "If an account exists, a verification email has been sent."
      });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({ message: "This email is already verified. You can sign in." });
    }

    const sent = await createAndSendVerificationEmail(user.id, user.email, user.name);

    if (!sent.ok) {
      return NextResponse.json({ error: sent.error }, { status: 500 });
    }

    return NextResponse.json({
      message: "Verification email sent. Check your inbox.",
      devVerifyUrl: sent.devVerifyUrl
    });
  } catch (e) {
    console.error("verify-email resend", e);
    return NextResponse.json({ error: "Could not send verification email." }, { status: 500 });
  }
}
