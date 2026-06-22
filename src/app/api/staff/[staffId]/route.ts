import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { removeStaffMember } from "@/lib/marketplace-server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const { staffId } = await params;
    const member = await prisma.staffMember.findUnique({ where: { id: staffId } });
    if (!member) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { shop: true }
    });
    if (user?.shop?.id !== member.shopId) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    await removeStaffMember(staffId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not remove staff." },
      { status: 400 }
    );
  }
}
