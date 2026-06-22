import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { submitMomoProof } from "@/lib/marketplace-server";
import type { MomoReceiptInput } from "@/types/marketplace";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const { orderId } = await params;
    const input = (await req.json()) as MomoReceiptInput;
    await submitMomoProof(session.userId, orderId, input);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not submit proof." },
      { status: 400 }
    );
  }
}
