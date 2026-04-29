import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";
import { TEAM_COLORS } from "@/lib/teams";

/**
 * Drill-down card for a single team. Top 75% is the team's representative
 * jersey image, bottom 25% is a brand-coloured ribbon with the team name +
 * product count. Hover lifts + neon-green glow.
 *
 * The `to` prop lets the caller send users to /teams/{slug} (clubs) or to
 * /nations/{slug} (national teams) — same card, two destinations.
 */
export default function TeamCard({
  to,
  slug,
  name,
  productCount,
  image,
}: {
  to: string;
  slug: string;
  name: string;
  productCount: number;
  image: string | null;
}) {
  const colors = TEAM_COLORS[slug] || {
    bg: "bg-accent",
    fg: "text-background",
  };

  return (
    <Link
      href={to}
      aria-label={`${name} — ${productCount} חולצות`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-glow-sm"
    >
      {/* Top 75%: jersey backdrop */}
      <div className="absolute inset-x-0 top-0 h-3/4 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-card-gradient" />
        )}
        {/* Soft fade into the ribbon */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-background/55"
        />
      </div>

      {/* Bottom 25%: brand-coloured ribbon */}
      <div
        className={`absolute inset-x-0 bottom-0 flex h-1/4 items-center justify-between gap-2 px-4 ${colors.bg} ${colors.fg}`}
      >
        <div className="flex flex-col leading-tight">
          <span className="font-display text-sm font-black uppercase tracking-tight md:text-base">
            {name}
          </span>
          <span className="font-display text-[10px] font-bold uppercase tracking-widest opacity-80">
            {productCount} חולצות
          </span>
        </div>
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
      </div>
    </Link>
  );
}
