import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addStaffMember } from "@/lib/marketplace-server";

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
    return NextResponse.json({ error: "Shop owner access required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const member = await addStaffMember({
      shopId: user.shop.id,
      name: body.name,
      roleTitle: body.roleTitle,
      phone: body.phone,
      performanceScore: body.performanceScore ?? 80
    });
    return NextResponse.json({ member });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not add staff." },
      { status: 400 }
    );
  }
}
