import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getHeroImageFor } from "@/lib/products";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";

type Category = {
  href: string;
  titleHe: string;
  titleEn: string;
  description: string;
  image: string | null;
  glow: string;
  border: string;
  accent: string;
};

// Pulled at module load (server-side); each picks the best representative
// product image from the catalog instead of random picsum.
const CATEGORIES: Category[] = [
  {
    href: "/leagues",
    titleHe: "ליגות מובילות",
    titleEn: "Top Leagues",
    description:
      "פרמייר ליג, לה ליגה, סריה א, בונדסליגה, ליג 1 ועוד — כל חולצות המועדונים הגדולים.",
    image:
      getHeroImageFor({ league: "premier-league" }) ||
      getHeroImageFor({ league: "la-liga" }),
    glow: "shadow-glow-cyan",
    border: "hover:border-cyan/60",
    accent: "text-cyan",
  },
  {
    href: "/nations",
    titleHe: "נבחרות לאומיות",
    titleEn: "National Teams",
    description: "ארגנטינה, ברזיל, פורטוגל, צרפת וכל חולצות המונדיאל 2026.",
    image:
      getHeroImageFor({ category: "national", isWorldCup2026: true }) ||
      getHeroImageFor({ category: "national" }),
    glow: "shadow-glow",
    border: "hover:border-accent/60",
    accent: "text-accent",
  },
  {
    href: "/retro",
    titleHe: "רטרו",
    titleEn: "Retro",
    description: "קלאסיקות שלא יחזרו: ארגנטינה 2010, ריאל 06-07, יונייטד 13-14.",
    image: getHeroImageFor({ isRetro: true }),
    glow: "shadow-gold",
    border: "hover:border-gold/60",
    accent: "text-gold",
  },
];

export default function CategoryShowcase() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-mesh-aurora opacity-70"
      />
      <div className="container relative py-16 md:py-24">
        <div className="mb-8 flex items-end justify-between gap-6 md:mb-12">
          <div className="space-y-2">
            <span className="section-eyebrow">Explore</span>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight md:text-5xl">
              בחרו את הצד שלכם
            </h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-surface transition-all duration-500 hover:-translate-y-1 ${cat.border} ${cat.glow}`}
            >
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.titleHe}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover opacity-90 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                />
              ) : (
                <div className="absolute inset-0 bg-card-gradient" />
              )}
              {/* dark overlay for legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/0" />
              {/* color tint per category */}
              <div
                className={`pointer-events-none absolute inset-0 mix-blend-overlay opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
                  cat.accent === "text-gold"
                    ? "bg-gold/20"
                    : cat.accent === "text-cyan"
                      ? "bg-cyan/20"
                      : "bg-accent/20"
                }`}
              />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 md:p-7">
                <span
                  className={`font-display text-xs font-bold uppercase tracking-widest ${cat.accent}`}
                >
                  {cat.titleEn}
                </span>
                <h3 className="font-display text-2xl font-black uppercase leading-tight text-foreground md:text-3xl">
                  {cat.titleHe}
                </h3>
                <p className="line-clamp-2 text-sm text-muted">{cat.description}</p>
                <div className={`mt-2 inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-widest text-foreground transition-colors group-hover:${cat.accent}`}>
                  גלה <ArrowLeft className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
