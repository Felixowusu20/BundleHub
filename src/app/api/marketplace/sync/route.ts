import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { getMarketplaceSync } from "@/lib/marketplace-server";

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    const data = await getMarketplaceSync(session);
    return NextResponse.json(data);
  } catch (e) {
    console.error("marketplace sync", e);
    return NextResponse.json({ error: "Could not load marketplace data." }, { status: 500 });
  }
}
