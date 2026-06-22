import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { patchService, removeService } from "@/lib/marketplace-server";
import type { UpdateServiceInput } from "@/types/marketplace";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const { serviceId } = await params;
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { shop: true }
    });
    const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "SUB_ADMIN";
    if (!isAdmin && user?.shop?.id !== service.shopId) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    const input = (await req.json()) as UpdateServiceInput;
    const updated = await patchService(serviceId, input);
    return NextResponse.json({ service: updated });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update service." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const { serviceId } = await params;
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { shop: true }
    });
    const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "SUB_ADMIN";
    if (!isAdmin && user?.shop?.id !== service.shopId) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    await removeService(serviceId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not delete service." },
      { status: 400 }
    );
  }
}
