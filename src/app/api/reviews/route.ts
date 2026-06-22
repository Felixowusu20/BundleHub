import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { submitReview } from "@/lib/marketplace-server";

export async function POST(req: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const { orderId, rating, title, body } = (await req.json()) as {
      orderId?: string;
      rating?: number;
      title?: string;
      body?: string;
    };
    if (!orderId || !rating) {
      return NextResponse.json({ error: "orderId and rating required." }, { status: 400 });
    }
    await submitReview(session.userId, orderId, rating, title, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not submit review." },
      { status: 400 }
    );
  }
}
