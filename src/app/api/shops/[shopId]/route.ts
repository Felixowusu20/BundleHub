import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  approveShop,
  deleteShop,
  featureShop,
  patchShop,
  updateShopStatus
} from "@/lib/marketplace-server";

async function requireShopAccess(shopId: string, session: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { shop: true }
  });
  if (!user) return { ok: false as const, user: null };
  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "SUB_ADMIN";
  const isOwner = user.shop?.id === shopId;
  return { ok: isAdmin || isOwner, user, isAdmin };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const { shopId } = await params;
    const access = await requireShopAccess(shopId, session);
    if (!access.ok) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    const body = await req.json();
    const { action, featured, ...input } = body as {
      action?: "approve" | "suspend" | "activate" | "feature" | "update" | "delete";
      featured?: boolean;
    };

    const adminOnly = new Set(["approve", "suspend", "activate", "feature", "delete"]);
    if (action && adminOnly.has(action) && !access.isAdmin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    if (action === "approve") await approveShop(shopId);
    else if (action === "suspend") await updateShopStatus(shopId, "suspended");
    else if (action === "activate") await updateShopStatus(shopId, "active");
    else if (action === "feature") await featureShop(shopId, !!featured);
    else if (action === "delete") await deleteShop(shopId);
    else if (action === "update" || !action) await patchShop(shopId, input);
    else return NextResponse.json({ error: "Invalid action." }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("shop PATCH", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update shop." },
      { status: 400 }
    );
  }
}
