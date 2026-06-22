import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const primaryAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN", adminTier: "PRIMARY" }
  });
  return NextResponse.json({ needsBootstrap: !primaryAdmin });
}
