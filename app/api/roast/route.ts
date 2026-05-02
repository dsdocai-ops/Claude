import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/extractText";
import { getRoast } from "@/lib/claude";
import { saveRoast } from "@/lib/store";
import { getRatelimit } from "@/lib/ratelimit";

export const maxDuration = 60;

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Rate limit by IP before doing any work
  const ratelimit = getRatelimit();
  if (ratelimit) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "anonymous";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 }
      );
    }
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { url } = body;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required." }, { status: 400 });
  }

  if (!isValidUrl(url)) {
    return NextResponse.json({ error: "Invalid URL. Please include https://" }, { status: 400 });
  }

  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WebsiteRoaster/1.0; +https://websiteroaster.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Could not fetch the website (HTTP ${res.status}). Make sure the URL is publicly accessible.`,
        },
        { status: 422 }
      );
    }

    html = await res.text();
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      {
        error: isAbort
          ? "The website took too long to respond."
          : "Could not reach the website. Check the URL and try again.",
      },
      { status: 422 }
    );
  }

  const text = extractText(html);
  if (text.trim().length < 50) {
    return NextResponse.json(
      {
        error:
          "Couldn't extract enough text from this website. It may require JavaScript to render.",
      },
      { status: 422 }
    );
  }

  const result = await getRoast(text, url);

  const id = crypto.randomUUID();
  await saveRoast(id, url, result);

  // Only return the public (free) fields — the full result is gated behind payment
  return NextResponse.json({
    id,
    siteUrl: url,
    result: { score: result.score, headline_feedback: result.headline_feedback },
  });
}
