import sanitizeHtml from "sanitize-html";

/**
 * Strict whitelist for supplier-provided product descriptions. Permits only
 * the inline tags we actually want to render — paragraphs, line breaks,
 * basic emphasis, and lists.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "b",
    "i",
    "ul",
    "ol",
    "li",
    "span",
  ],
  allowedAttributes: {
    span: ["dir"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  parser: { lowerCaseTags: true },
};

export function sanitizeDescription(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(input, OPTIONS).trim();
}

/**
 * Returns the description as an array of plain-text paragraphs ready to be
 * rendered as JSX paragraphs. Sanitizes first via the strict whitelist, then
 * splits on paragraph/break boundaries and strips remaining tags so the
 * consumer can render with regular React JSX (no raw HTML injection).
 */
export function descriptionParagraphs(
  input: string | null | undefined,
): string[] {
  const cleaned = sanitizeDescription(input);
  if (!cleaned) return [];
  return cleaned
    .replace(/<\/?(p|br|li)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
