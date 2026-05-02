import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { code } = body;
  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  const unlockCode = process.env.UNLOCK_CODE;
  if (!unlockCode) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  return NextResponse.json({ valid: code.trim() === unlockCode });
}
