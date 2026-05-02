import Anthropic from "@anthropic-ai/sdk";
import type { RoastResult } from "./types";

export type { RoastResult, PublicRoastResult } from "./types";
export { isFullResult } from "./types";

const MOCK_RESULT: RoastResult = {
  score: 5,
  headline_feedback:
    "The headline is vague and doesn't communicate a clear benefit. Visitors can't tell what you do in the first 3 seconds.",
  value_prop_feedback:
    "Your value proposition is buried below the fold. Lead with what makes you different — not just what you do.",
  ux_issues: [
    "Navigation has too many items, causing decision paralysis",
    "The primary CTA button blends into the background",
    "Mobile layout stacks elements awkwardly — test on a real device",
  ],
  trust_issues: [
    "No customer testimonials visible above the fold",
    "Missing trust badges (SSL, reviews, press mentions)",
    "No team or company information — feels anonymous",
  ],
  cta_feedback:
    "The CTA says 'Submit' — the least inspiring word in the English language. Tell people exactly what happens next.",
  improvements: [
    "Rewrite your headline to state the outcome, not the feature",
    "Add 3 customer testimonials with photos above the fold",
    "Change your CTA copy to a specific action (e.g., 'Get My Free Quote')",
  ],
  rewritten_headline:
    "Stop losing customers to a confusing website — we build landing pages that convert.",
};

// Stable instructions in the system prompt — keeps user messages short (only variable content)
const SYSTEM_PROMPT = `You are a conversion rate optimization expert. Analyze websites for conversion effectiveness.

Focus on:
1. Headline clarity
2. Value proposition
3. UX friction points
4. Trust signals
5. Call-to-action strength

Return ONLY valid JSON with no markdown fences or explanation:

{
  "score": <number 1-10>,
  "headline_feedback": "<concise critique>",
  "value_prop_feedback": "<concise critique>",
  "ux_issues": ["<issue 1>", "<issue 2>", "<issue 3>"],
  "trust_issues": ["<issue 1>", "<issue 2>"],
  "cta_feedback": "<concise critique>",
  "improvements": ["<action 1>", "<action 2>", "<action 3>"],
  "rewritten_headline": "<a better headline for this site>"
}

Be direct, specific, and slightly critical. Focus on what would actually move the needle for conversions.`;

function parseRoast(raw: string): RoastResult {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  const score = Math.min(10, Math.max(1, Number(parsed.score) || 5));

  return {
    score,
    headline_feedback: String(parsed.headline_feedback || ""),
    value_prop_feedback: String(parsed.value_prop_feedback || ""),
    ux_issues: Array.isArray(parsed.ux_issues) ? parsed.ux_issues.map(String) : [],
    trust_issues: Array.isArray(parsed.trust_issues) ? parsed.trust_issues.map(String) : [],
    cta_feedback: String(parsed.cta_feedback || ""),
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
    rewritten_headline: String(parsed.rewritten_headline || ""),
  };
}

export async function getRoast(
  text: string,
  url: string
): Promise<RoastResult> {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    console.warn("CLAUDE_API_KEY not set — returning mock result");
    return MOCK_RESULT;
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001", // 3x cheaper than sonnet; sufficient for structured JSON
      max_tokens: 600,              // JSON response is ~400 tokens; 600 is safe headroom
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `URL: ${url}\n\nWebsite content:\n${text}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    return parseRoast(content.text);
  } catch (err) {
    console.error("Claude API error:", err);
    return MOCK_RESULT;
  }
}
