import Link from "next/link";
import Image from "next/image";

/**
 * Homepage hero banner.
 *
 * The image at /public/images/hero/hero-banner.jpg ships with the headline,
 * tagline, and "קנה עכשיו" CTA already baked in (1717×916, ~1.87:1). We render
 * it full-bleed and wrap the whole thing in a single <Link> so any tap or
 * click — anywhere on the banner — lands on the catalogue.
 *
 * Sizing strategy:
 *   - Container respects the source aspect via `aspect-[1717/916]`
 *   - `min-h-[280px]` keeps mobile from getting too short
 *   - `max-h-[640px]` keeps desktop from eating the whole viewport
 *   - `object-cover` + `object-position: center` keeps the central jersey
 *     visible at any aspect; minor side-crop on narrow mobile is acceptable
 */
export default function HeroBanner() {
  return (
    <section aria-label="Hero" className="relative w-full">
      <Link
        href="/products"
        aria-label="לבש את התשוקה למשחק — לכל החולצות"
        className="group relative block aspect-[1717/916] min-h-[280px] max-h-[640px] w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Image
          src="/images/hero/hero-banner.jpg"
          alt="לבש את התשוקה למשחק — חולצות כדורגל מהליגות והנבחרות הכי גדולות בעולם"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
        />
      </Link>
    </section>
  );
}
