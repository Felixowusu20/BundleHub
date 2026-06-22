import { NextResponse } from "next/server";
import { getHomepagePayload } from "@/lib/homepage";

export async function GET() {
  try {
    const data = await getHomepagePayload();
    return NextResponse.json(data);
  } catch (e) {
    console.error("homepage GET", e);
    return NextResponse.json({ error: "Could not load homepage." }, { status: 500 });
  }
}
