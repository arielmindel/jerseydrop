import Link from "next/link";
import Image from "next/image";

/**
 * Homepage hero banner.
 *
 * The image at /public/images/hero/hero-banner.jpg ships with the headline,
 * tagline, and "קנה עכשיו" CTA already painted in. Only the button itself is
 * clickable — an invisible <Link> sits exactly over the painted button and
 * relies on cursor:pointer + a subtle scale-up on hover for the click cue.
 *
 * No box-shadow halo / ring is rendered around the button at rest — earlier
 * versions added a gold pulse that visually appeared as a SECOND rectangle
 * just outside the painted border, so we removed it. The painted gold border
 * is the visual; this component only owns interactivity.
 */
export default function HeroBanner() {
  return (
    <section aria-label="Hero" className="relative w-full">
      {/* aspect-[1717/916] alone — no max-h, no min-h. With max-h, the
          container's actual aspect differed from the image's natural aspect,
          which forced object-cover to crop top/bottom and shifted the
          painted button DOWN inside the visible area. The Link's % then
          pointed to the wrong place. Removing the height clamp keeps the
          rendered area at the source's natural ratio everywhere → the % we
          measured against the source image stays valid at every breakpoint. */}
      <div className="relative aspect-[1717/916] w-full overflow-hidden">
        <Image
          src="/images/hero/hero-banner.jpg"
          alt="לבש את התשוקה למשחק — חולצות כדורגל מהליגות והנבחרות הכי גדולות בעולם"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Clickable area precisely over the painted "קנה עכשיו" button.
            Pixel-measured (canvas scan) at x=12.43%→32.36%, y=68.49%→77.73%
            so the link sits exactly on the visible button. */}
        <Link
          href="/products"
          aria-label="קנה עכשיו — לכל החולצות"
          className="group/cta absolute z-10 cursor-pointer overflow-hidden rounded-md transition-transform duration-300 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{
            left: "12.43%",
            top: "68.49%",
            width: "19.93%",
            height: "9.24%",
          }}
        >
          {/* Pulsing gold tint — bg-color only, no shadow/ring. The painted
              border stays exactly the same; only the button interior gets
              a gold wash that fades in and out. */}
          <span
            aria-hidden
            className="hero-cta-pulse absolute inset-0 rounded-md transition-colors duration-300 group-hover/cta:bg-gold/30"
          />
          <span className="sr-only">קנה עכשיו</span>
        </Link>
      </div>
    </section>
  );
}
