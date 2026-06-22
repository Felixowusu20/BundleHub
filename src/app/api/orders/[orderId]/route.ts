import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteOrder, openDispute, updateOrderStatus } from "@/lib/marketplace-server";
import type { OrderStatus } from "@/types/marketplace";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const { orderId } = await params;
    const body = (await req.json()) as {
      status?: OrderStatus;
      action?: "dispute";
      reason?: string;
    };

    if (body.action === "dispute") {
      await openDispute(session.userId, orderId, body.reason ?? "");
      return NextResponse.json({ ok: true });
    }

    if (!body.status) {
      return NextResponse.json({ error: "Status required." }, { status: 400 });
    }
    await updateOrderStatus(session.userId, session.role, orderId, body.status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update order." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "SUB_ADMIN")) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  try {
    const { orderId } = await params;
    await deleteOrder(orderId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not delete order." },
      { status: 400 }
    );
  }
}
