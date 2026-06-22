import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { placeOrder } from "@/lib/marketplace-server";
import type { PlaceOrderInput } from "@/types/marketplace";

export async function POST(req: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const input = (await req.json()) as PlaceOrderInput;
    const result = await placeOrder(session.userId, input);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not place order." },
      { status: 400 }
    );
  }
}
