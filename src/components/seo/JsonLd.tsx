/**
 * Server component that renders a JSON-LD <script> block.
 *
 * Why dangerouslySetInnerHTML and not children?
 * Children rendering puts the JSON inside a React text node, which goes
 * through React's HTML-escape pipeline — both at render time on the server
 * AND when the client compares server HTML to its own re-render. With
 * non-ASCII characters like the Hebrew geresh `׳` (U+05F3) the bytes the
 * server emits and the bytes the client computes for the same string can
 * differ (encoding-wise), and React reports a hydration mismatch — which
 * in production tears the entire DOM down and re-renders client-side,
 * which in turn breaks Next/Image lazy loading and leaves product images
 * blank. Using `dangerouslySetInnerHTML` bypasses the text-node pipeline:
 * the bytes go in the script tag exactly as serialised, server and client
 * agree, no mismatch.
 *
 * Data is always serialised from a trusted server-side object (no user
 * input), and we pre-escape `<` to prevent accidental script-tag injection.
 */
export default function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
