import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  LaLigaLogo,
  PremierLeagueLogo,
  BundesligaLogo,
  SerieALogo,
  Ligue1Logo,
  NationsLogo,
  WorldCupLogo,
  OtherLeaguesLogo,
} from "@/components/icons/LeagueLogos";

/**
 * Magazine grid of league/category cards on the homepage. After V5 feedback:
 * each card now shows a branded SVG emblem (NOT a jersey photo) on a
 * gradient background that matches the league's identity. Hover lifts the
 * logo and brightens the gradient.
 *
 * The emblems live in components/icons/LeagueLogos.tsx — they're hand-built
 * abstractions, not the trademarked official marks.
 */

type LeagueTile = {
  href: string;
  titleHe: string;
  titleEn: string;
  /** Background gradient (CSS) for the card's main area. */
  bgGradient: string;
  /** Tailwind colour class for the title ribbon at the bottom. */
  ribbonClass: string;
  /** SVG logo component. */
  Logo: (props: { className?: string }) => JSX.Element;
};

const TILES: LeagueTile[] = [
  // Row 1
  {
    href: "/leagues/la-liga",
    titleHe: "ליגה ספרדית",
    titleEn: "La Liga",
    bgGradient:
      "radial-gradient(circle at 50% 35%, #2A1100 0%, #0B0500 100%)",
    ribbonClass: "bg-amber/95 text-background",
    Logo: LaLigaLogo,
  },
  {
    href: "/leagues/premier-league",
    titleHe: "ליגה אנגלית",
    titleEn: "Premier League",
    bgGradient:
      "radial-gradient(circle at 50% 35%, #1A0826 0%, #07000C 100%)",
    ribbonClass: "bg-violet/95 text-foreground",
    Logo: PremierLeagueLogo,
  },
  {
    href: "/nations",
    titleHe: "נבחרות",
    titleEn: "National Teams",
    bgGradient:
      "radial-gradient(circle at 50% 35%, #051A24 0%, #000A12 100%)",
    ribbonClass: "bg-cyan/95 text-background",
    Logo: NationsLogo,
  },
  {
    href: "/collections/world-cup-2026",
    titleHe: "מונדיאל",
    titleEn: "World Cup 2026",
    bgGradient:
      "radial-gradient(circle at 50% 30%, #1A0F00 0%, #000000 100%)",
    ribbonClass: "bg-gold/95 text-background",
    Logo: WorldCupLogo,
  },
  // Row 2
  {
    href: "/leagues/other",
    titleHe: "ליגות אחרות",
    titleEn: "Other Leagues",
    bgGradient:
      "radial-gradient(circle at 50% 35%, #042819 0%, #00100A 100%)",
    ribbonClass: "bg-accent/95 text-background",
    Logo: OtherLeaguesLogo,
  },
  {
    href: "/leagues/ligue-1",
    titleHe: "ליגה צרפתית",
    titleEn: "Ligue 1",
    bgGradient:
      "radial-gradient(circle at 50% 35%, #001436 0%, #00071A 100%)",
    ribbonClass: "bg-blue-500/95 text-foreground",
    Logo: Ligue1Logo,
  },
  {
    href: "/leagues/bundesliga",
    titleHe: "ליגה גרמנית",
    titleEn: "Bundesliga",
    bgGradient:
      "radial-gradient(circle at 50% 35%, #2A0007 0%, #100002 100%)",
    ribbonClass: "bg-destructive/95 text-foreground",
    Logo: BundesligaLogo,
  },
  {
    href: "/leagues/serie-a",
    titleHe: "ליגה איטלקית",
    titleEn: "Serie A",
    bgGradient:
      "radial-gradient(circle at 50% 35%, #00103A 0%, #00071A 100%)",
    ribbonClass: "bg-sky-400/95 text-background",
    Logo: SerieALogo,
  },
];

export default function LeaguesShowcase() {
  return (
    <section className="container py-14 md:py-20">
      <div className="mb-8 text-center md:mb-12">
        <h2
          className="font-display text-5xl font-black uppercase tracking-tight md:text-7xl"
          style={{
            WebkitTextStroke: "1.5px rgba(212, 175, 55, 0.45)",
            color: "transparent",
            textShadow: "0 0 40px rgba(212, 175, 55, 0.15)",
          }}
        >
          ליגות
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-border transition-all duration-500 hover:-translate-y-1 hover:border-accent/50 hover:shadow-glow-sm md:aspect-[3/4.2]"
            style={{ background: t.bgGradient }}
          >
            {/* Main logo panel — fills ~70% of the card height */}
            <div className="absolute inset-x-0 top-0 flex h-[78%] items-center justify-center p-6">
              <t.Logo className="h-full w-auto max-w-[80%] drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-105" />
            </div>

            {/* English subtitle floating above the ribbon */}
            <div className="absolute inset-x-0 bottom-[44px] text-center">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-muted/80">
                {t.titleEn}
              </span>
            </div>

            {/* Coloured ribbon */}
            <div
              className={`absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-4 py-3 ${t.ribbonClass}`}
            >
              <span className="font-display text-base font-black uppercase leading-none tracking-tight md:text-lg">
                {t.titleHe}
              </span>
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
