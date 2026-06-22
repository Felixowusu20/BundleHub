import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { mapDbUser } from "@/lib/auth-user";

export async function PATCH(req: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, city, avatarUrl } = body as {
      name?: string;
      phone?: string;
      city?: string;
      avatarUrl?: string | null;
    };

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
        ...(city !== undefined ? { city: city.trim() || null } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {})
      },
      include: { shop: true }
    });

    return NextResponse.json({ user: mapDbUser(user) });
  } catch (e) {
    console.error("profile", e);
    return NextResponse.json({ error: "Could not update profile." }, { status: 500 });
  }
}
