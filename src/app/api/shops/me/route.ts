import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { shop: true }
  });

  if (!user?.shop) {
    return NextResponse.json({ error: "No shop linked." }, { status: 404 });
  }

  const shop = user.shop;
  return NextResponse.json({
    shop: {
      id: shop.id,
      name: shop.name,
      description: shop.description,
      phone: shop.phone,
      city: shop.city,
      status: shop.status.toLowerCase() as "pending" | "active" | "suspended"
    }
  });
}
