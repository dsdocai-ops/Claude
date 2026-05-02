import { NextRequest, NextResponse } from "next/server";
import { markPaid } from "@/lib/store";

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

  const valid = code.trim() === unlockCode;
  if (valid && id && typeof id === "string") {
    await markPaid(id);
  }

  return NextResponse.json({ valid });
}
