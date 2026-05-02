// Patterns that could instruct the LLM to ignore its system prompt or change its behaviour.
// We replace matches with a neutral placeholder so the content isn't silently dropped.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context|rules?)/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/gi,
  /you\s+are\s+now\s+(?:a\s+)?(?:an?\s+)?\w/gi,
  /forget\s+everything\s+(above|before|prior|previously)/gi,
  /new\s+instructions?:/gi,
  /\[SYSTEM\]/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|(?:system|user|assistant|im_start|im_end)\|>/gi, // token-boundary injection markers
  /###\s*(?:INSTRUCTION|SYSTEM|HUMAN|ASSISTANT|PROMPT)/gi,
];

function sanitiseForLLM(text: string): string {
  let out = text;
  for (const pattern of INJECTION_PATTERNS) {
    out = out.replace(pattern, "[content removed]");
  }
  return out;
}

export function extractText(html: string): string {
  // Remove script, style, noscript, svg, and comment blocks
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Inject whitespace around block-level elements so words don't merge
  text = text.replace(
    /<\/(p|div|h[1-6]|li|td|th|section|article|header|footer|nav|main|aside|blockquote|pre)>/gi,
    " \n"
  );

  // Strip all remaining tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&#(\d+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 10))
    );

  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Sanitise prompt-injection attempts before the text is sent to Claude
  text = sanitiseForLLM(text);

  // Cap at ~8000 chars to stay within token limits
  if (text.length > 8000) {
    text = text.slice(0, 8000) + "…";
  }

  return text;
}
