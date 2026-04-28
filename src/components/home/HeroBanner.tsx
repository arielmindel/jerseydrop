import Link from "next/link";
import Image from "next/image";

/**
 * Homepage hero banner.
 *
 * The image at /public/images/hero/hero-banner.jpg ships with the headline,
 * tagline, and "קנה עכשיו" CTA already painted in. Only the button itself is
 * clickable — a precisely positioned <Link> overlay sits on top of the
 * painted button (percentages, so it scales with the image at any width).
 *
 * The overlay carries a soft gold pulse so visitors know it's interactive
 * even before they hover, and intensifies on hover/focus.
 */
export default function HeroBanner() {
  return (
    <section aria-label="Hero" className="relative w-full">
      <div className="relative aspect-[1717/916] min-h-[280px] max-h-[640px] w-full overflow-hidden">
        <Image
          src="/images/hero/hero-banner.jpg"
          alt="לבש את התשוקה למשחק — חולצות כדורגל מהליגות והנבחרות הכי גדולות בעולם"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Clickable area precisely over the painted "קנה עכשיו" button.
            Percentages match the source PNG (1717×916) so the link scales
            cleanly at every breakpoint. */}
        <Link
          href="/products"
          aria-label="קנה עכשיו — לכל החולצות"
          className="group/cta absolute z-10 cursor-pointer rounded-md transition-all duration-300 hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{
            left: "11%",
            top: "70%",
            width: "22%",
            height: "11%",
          }}
        >
          {/* Always-on soft halo so visitors clock that this is clickable */}
          <span
            aria-hidden
            className="hero-cta-pulse absolute inset-0 rounded-md"
          />
          {/* Stronger glow on hover */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-md ring-2 ring-gold/0 transition-all duration-300 group-hover/cta:ring-gold group-hover/cta:shadow-[0_0_36px_6px_rgba(212,175,55,0.7)]"
          />
          {/* Brightness wash on hover so the painted button "lights up" */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-md bg-gold/0 transition-colors duration-300 group-hover/cta:bg-gold/15"
          />
          <span className="sr-only">קנה עכשיו</span>
        </Link>
      </div>
    </section>
  );
}
