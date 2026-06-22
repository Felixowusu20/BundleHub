import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { mapDbUser } from "@/lib/auth-user";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { shop: true }
  });

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: mapDbUser(user) });
}
