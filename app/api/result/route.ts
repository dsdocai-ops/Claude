import { NextRequest, NextResponse } from "next/server";
import { getRoastById } from "@/lib/store";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const entry = getRoastById(id);
  if (!entry) {
    return NextResponse.json({ error: "Result not found or expired." }, { status: 404 });
  }

  return NextResponse.json(entry);
}
