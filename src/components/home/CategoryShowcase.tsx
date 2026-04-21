import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Category = {
  href: string;
  titleHe: string;
  titleEn: string;
  description: string;
  image: string;
  accent?: "gold" | "green";
};

const CATEGORIES: Category[] = [
  {
    href: "/leagues",
    titleHe: "ליגות מובילות",
    titleEn: "Top Leagues",
    description:
      "פרמייר ליג, לה ליגה, סריה א, בונדסליגה, ליג 1 ועוד — כל חולצות המועדונים הגדולים.",
    image: "https://picsum.photos/seed/jd-cat-leagues/900/1100",
    accent: "green",
  },
  {
    href: "/nations",
    titleHe: "נבחרות לאומיות",
    titleEn: "National Teams",
    description:
      "ארגנטינה, ברזיל, פורטוגל, צרפת וכל חולצות המונדיאל 2026.",
    image: "https://picsum.photos/seed/jd-cat-nations/900/1100",
    accent: "green",
  },
  {
    href: "/retro",
    titleHe: "רטרו",
    titleEn: "Retro",
    description:
      "קלאסיקות שלא יחזרו: ארגנטינה 2010, ריאל 06-07, יונייטד 13-14.",
    image: "https://picsum.photos/seed/jd-cat-retro/900/1100",
    accent: "gold",
  },
];

export default function CategoryShowcase() {
  return (
    <section className="container py-16 md:py-24">
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
            className="group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-surface"
          >
            <Image
              src={cat.image}
              alt={cat.titleEn}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div
              className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
                cat.accent === "gold"
                  ? "shadow-[inset_0_0_60px_rgba(212,175,55,0.35)]"
                  : "shadow-[inset_0_0_60px_rgba(0,255,136,0.35)]"
              }`}
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 md:p-7">
              <span
                className={`font-display text-xs font-bold uppercase tracking-widest ${
                  cat.accent === "gold" ? "text-gold" : "text-accent"
                }`}
              >
                {cat.titleEn}
              </span>
              <h3 className="font-display text-2xl font-black uppercase leading-tight text-foreground md:text-3xl">
                {cat.titleHe}
              </h3>
              <p className="line-clamp-2 text-sm text-muted">{cat.description}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-widest text-foreground transition-colors group-hover:text-accent">
                גלה <ArrowLeft className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
