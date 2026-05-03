import { NextRequest, NextResponse } from "next/server";
import { markPaid, getRoastById } from "@/lib/store";

export async function POST(req: NextRequest) {
  let body: { code?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { code, id } = body;
  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  const unlockCode = process.env.UNLOCK_CODE;
  if (!unlockCode) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  if (code.trim() !== unlockCode) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  if (id && typeof id === "string") {
    await markPaid(id);
    const entry = await getRoastById(id);
    if (entry) {
      return NextResponse.json({ valid: true, siteUrl: entry.siteUrl, result: entry.result });
    }
  }

  return NextResponse.json({ valid: true });
}
