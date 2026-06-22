import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { topUpWallet, withdrawWallet } from "@/lib/marketplace-server";

export async function POST(req: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const { action, amountGhs } = (await req.json()) as {
      action?: "topup" | "withdraw";
      amountGhs?: number;
    };
    if (!action || amountGhs == null) {
      return NextResponse.json({ error: "action and amountGhs required." }, { status: 400 });
    }
    if (action === "topup") await topUpWallet(session.userId, amountGhs);
    else if (action === "withdraw") await withdrawWallet(session.userId, amountGhs);
    else return NextResponse.json({ error: "Invalid action." }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Wallet action failed." },
      { status: 400 }
    );
  }
}
