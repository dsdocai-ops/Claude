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

  // Cap at ~8000 chars to stay within token limits
  if (text.length > 8000) {
    text = text.slice(0, 8000) + "…";
  }

  return text;
}
