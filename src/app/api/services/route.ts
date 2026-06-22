import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createService } from "@/lib/marketplace-server";
import type { ServiceListing } from "@/types/marketplace";

export async function POST(req: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { shop: true }
  });
  if (!user?.shop) {
    return NextResponse.json({ error: "No shop linked." }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      shopId?: string;
      service?: Omit<ServiceListing, "id" | "shopId" | "rating" | "trustScore">;
    };
    const shopId = body.shopId ?? user.shop.id;
    if (shopId !== user.shop.id && user.role !== "SUPER_ADMIN" && user.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }
    if (!body.service) {
      return NextResponse.json({ error: "Service payload required." }, { status: 400 });
    }
    const service = await createService(shopId, body.service);
    return NextResponse.json({ service });
  } catch (e) {
    console.error("services POST", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create service." },
      { status: 400 }
    );
  }
}
