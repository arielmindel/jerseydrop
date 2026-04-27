/**
 * Small "JerseyDrop" badge that overlays product images to cover the
 * supplier's "SPORT HUB" / "SPORTHUB" watermark.
 *
 * Position: bottom-right (physical) of the image — that's where supplier
 * watermarks sit. Uses `right-2` (physical) so it lands on the same corner
 * regardless of RTL layout context.
 *
 * Only applied to images sourced from supplier CDNs (shopify / yupoo proxy);
 * once we ship images from our own CDN this can be turned off per image.
 */
export default function JerseyDropWatermark({
  src,
  size = "md",
}: {
  /** The image URL — used to decide whether to render the badge. */
  src?: string;
  size?: "sm" | "md";
}) {
  if (!src) return null;
  const isSupplier =
    src.includes("cdn.shopify.com") ||
    src.includes("/api/yupoo-image") ||
    src.includes("photo.yupoo.com");
  if (!isSupplier) return null;

  const cls =
    size === "sm"
      ? "bottom-1.5 right-1.5 px-1.5 py-0.5 text-[8px]"
      : "bottom-2 right-2 px-2 py-1 text-[10px]";

  return (
    <div
      className={`pointer-events-none absolute z-10 select-none rounded-md border border-accent/40 bg-background/85 font-display font-black uppercase tracking-[0.2em] text-accent shadow-glow-sm backdrop-blur-sm ${cls}`}
      aria-hidden="true"
    >
      JerseyDrop
    </div>
  );
}
