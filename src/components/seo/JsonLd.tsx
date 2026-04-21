/**
 * Server component that renders a JSON-LD <script> block.
 * Data is always serialized from a trusted server-side object — no user input.
 * Uses children-based rendering (React's safe text-node approach).
 */
export default function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}) {
  // Escape `<` to prevent accidental script injection; React auto-escapes other text content.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json">{json}</script>;
}
