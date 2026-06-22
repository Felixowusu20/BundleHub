import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { sendChatMessage } from "@/lib/marketplace-server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const { conversationId } = await params;
    const { body, from } = (await req.json()) as {
      body?: string;
      from?: "customer" | "shop";
    };
    if (!body?.trim() || !from) {
      return NextResponse.json({ error: "Message body and sender required." }, { status: 400 });
    }
    await sendChatMessage(session.userId, conversationId, body, from);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not send message." },
      { status: 400 }
    );
  }
}
