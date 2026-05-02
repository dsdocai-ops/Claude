import { NextRequest, NextResponse } from "next/server";
import { getRoastById } from "@/lib/store";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const entry = await getRoastById(id);
  if (!entry) {
    return NextResponse.json({ error: "Result not found or expired." }, { status: 404 });
  }

  if (!entry.paid) {
    // Return only the free fields so the full result never leaves the server unpaid
    return NextResponse.json({
      siteUrl: entry.siteUrl,
      paid: false,
      result: { score: entry.result.score, headline_feedback: entry.result.headline_feedback },
    });
  }

  return NextResponse.json({ siteUrl: entry.siteUrl, paid: true, result: entry.result });
}
