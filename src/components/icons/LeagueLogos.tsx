/**
 * Hand-built brand emblems for the homepage LeaguesShowcase.
 *
 * These are NOT the official league logos (those are trademarked) — they're
 * stylised marks that evoke each league's identity using public colours +
 * geometric forms. Designed to render large on dark cards (~60% of card area)
 * and stay crisp at any size.
 *
 * Why inline SVG and not separate files?
 *   - 1 HTTP request instead of 8
 *   - currentColor lets us recolour from the parent without per-file edits
 *   - small enough that the JS payload cost is < 6KB total
 *
 * Each component is a 200×200 viewBox so they all scale identically.
 */

type LogoProps = { className?: string };

/** La Liga — Spanish flag bands + shield + crown silhouette in red+gold */
export function LaLigaLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="ll-bg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#C13B00" />
        </linearGradient>
      </defs>
      {/* Shield */}
      <path
        d="M100 18 L168 38 L168 96 C168 138 138 168 100 184 C62 168 32 138 32 96 L32 38 Z"
        fill="url(#ll-bg)"
        stroke="#FFD66B"
        strokeWidth="3"
      />
      {/* Crown */}
      <path
        d="M64 56 L74 70 L88 50 L100 72 L112 50 L126 70 L136 56 L132 88 L68 88 Z"
        fill="#FFD66B"
      />
      {/* LL monogram */}
      <text
        x="100"
        y="148"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="62"
        fill="#FFFFFF"
        letterSpacing="-3"
      >
        LL
      </text>
    </svg>
  );
}

/** Premier League — purple shield + lion silhouette */
export function PremierLeagueLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="pl-bg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3D195B" />
          <stop offset="100%" stopColor="#37003C" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="86" fill="url(#pl-bg)" stroke="#04F5FF" strokeWidth="3" />
      {/* Lion crown silhouette (heraldic abstraction) */}
      <path
        d="M58 124 L60 100 L72 92 L72 78 L84 84 L88 70 L100 80 L112 70 L116 84 L128 78 L128 92 L140 100 L142 124 L132 130 L132 140 L120 138 L116 146 L108 144 L104 152 L96 152 L92 144 L84 146 L80 138 L68 140 L68 130 Z"
        fill="#04F5FF"
      />
      {/* PL */}
      <text
        x="100"
        y="178"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="20"
        fill="#04F5FF"
        letterSpacing="3"
      >
        PREMIER
      </text>
    </svg>
  );
}

/** Bundesliga — red+black with stripe + "BL" */
export function BundesligaLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="bl-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#D20515" />
          <stop offset="100%" stopColor="#8B0010" />
        </linearGradient>
      </defs>
      <rect x="22" y="22" width="156" height="156" rx="24" fill="url(#bl-bg)" />
      {/* Diagonal stripes evoking ball-in-motion */}
      <g opacity="0.18">
        <rect x="-20" y="60" width="260" height="6" fill="#000" transform="rotate(-12 100 100)" />
        <rect x="-20" y="76" width="260" height="6" fill="#000" transform="rotate(-12 100 100)" />
        <rect x="-20" y="92" width="260" height="6" fill="#000" transform="rotate(-12 100 100)" />
      </g>
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="68"
        fill="#FFFFFF"
        letterSpacing="-3"
      >
        BL
      </text>
      <text
        x="100"
        y="148"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontWeight="700"
        fontSize="14"
        fill="#FFFFFF"
        letterSpacing="4"
      >
        BUNDESLIGA
      </text>
    </svg>
  );
}

/** Serie A — Italian flag rosette + monogram */
export function SerieALogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="sa-bg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1B5CFF" />
          <stop offset="100%" stopColor="#0033B5" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="86" fill="url(#sa-bg)" />
      {/* Italian-flag tricolore as inner ring */}
      <circle cx="100" cy="100" r="70" fill="none" stroke="#009246" strokeWidth="6" strokeDasharray="146" strokeDashoffset="0" transform="rotate(-90 100 100)" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeDasharray="146 292" strokeDashoffset="-146" transform="rotate(-90 100 100)" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="#CE2B37" strokeWidth="6" strokeDasharray="146 292" strokeDashoffset="-292" transform="rotate(-90 100 100)" />
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="56"
        fill="#FFFFFF"
        letterSpacing="-2"
      >
        SA
      </text>
    </svg>
  );
}

/** Ligue 1 — French hexagon with tricolore */
export function Ligue1Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="l1-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#0055A4" />
          <stop offset="100%" stopColor="#001B45" />
        </linearGradient>
      </defs>
      {/* Hexagon — France's iconic shape */}
      <polygon
        points="100,18 168,58 168,142 100,182 32,142 32,58"
        fill="url(#l1-bg)"
        stroke="#EF4135"
        strokeWidth="3"
      />
      {/* Tricolore vertical bands inside */}
      <g opacity="0.85">
        <rect x="76" y="46" width="6" height="108" fill="#FFFFFF" />
        <rect x="118" y="46" width="6" height="108" fill="#EF4135" />
      </g>
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="68"
        fill="#FFFFFF"
        letterSpacing="-3"
      >
        L1
      </text>
    </svg>
  );
}

/** Nations — globe with flag-stripe equator */
export function NationsLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="nat-bg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0E7490" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="86" fill="url(#nat-bg)" />
      {/* Latitude lines */}
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.65">
        <ellipse cx="100" cy="100" rx="86" ry="28" />
        <ellipse cx="100" cy="100" rx="86" ry="56" />
        <line x1="14" y1="100" x2="186" y2="100" />
        <line x1="100" y1="14" x2="100" y2="186" />
      </g>
      {/* Stars representing nations */}
      <g fill="#FFD66B">
        {[
          [60, 70],
          [140, 70],
          [80, 130],
          [120, 130],
          [100, 50],
        ].map(([cx, cy], i) => (
          <polygon
            key={i}
            points={`${cx},${cy - 8} ${cx + 2},${cy - 2} ${cx + 8},${cy - 2} ${cx + 3},${cy + 2} ${cx + 5},${cy + 8} ${cx},${cy + 4} ${cx - 5},${cy + 8} ${cx - 3},${cy + 2} ${cx - 8},${cy - 2} ${cx - 2},${cy - 2}`}
          />
        ))}
      </g>
    </svg>
  );
}

/** World Cup 2026 — FIFA-style trophy silhouette in gold */
export function WorldCupLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="wc-bg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1A0F00" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <linearGradient id="wc-gold" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
      </defs>
      <rect x="22" y="22" width="156" height="156" rx="24" fill="url(#wc-bg)" />
      {/* Trophy — abstracted from the FIFA cup silhouette */}
      <g transform="translate(100 100)">
        {/* Globe at top */}
        <ellipse cx="0" cy="-44" rx="22" ry="20" fill="url(#wc-gold)" />
        <path
          d="M-22 -44 Q-22 -54 0 -56 Q22 -54 22 -44"
          fill="none"
          stroke="#8B6914"
          strokeWidth="1.5"
        />
        {/* Twisted handles meeting at the cup */}
        <path
          d="M-22 -40 C-32 -20, -28 0, -10 8 L-10 18 L10 18 L10 8 C28 0, 32 -20, 22 -40"
          fill="url(#wc-gold)"
          stroke="#8B6914"
          strokeWidth="1.5"
        />
        {/* Stem */}
        <rect x="-12" y="18" width="24" height="14" fill="url(#wc-gold)" />
        {/* Base */}
        <rect x="-26" y="32" width="52" height="14" rx="2" fill="url(#wc-gold)" />
        <rect x="-32" y="46" width="64" height="12" rx="2" fill="url(#wc-gold)" />
      </g>
      {/* "2026" mark below */}
      <text
        x="100"
        y="172"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="16"
        fill="#D4AF37"
        letterSpacing="6"
      >
        2026
      </text>
    </svg>
  );
}

/** Other Leagues — green field + ball with continents */
export function OtherLeaguesLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="ol-bg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
      </defs>
      <rect x="22" y="22" width="156" height="156" rx="24" fill="url(#ol-bg)" />
      {/* Football */}
      <circle cx="100" cy="100" r="48" fill="#FFFFFF" />
      {/* Football pentagons abstracted */}
      <g fill="#0A1F18">
        <polygon points="100,72 112,82 108,98 92,98 88,82" />
        <polygon points="76,96 86,108 82,122 70,116 68,104" />
        <polygon points="124,96 132,104 130,116 118,122 114,108" />
        <polygon points="100,114 112,122 108,138 92,138 88,122" />
      </g>
      {/* Outer ring of small dots = "around the world" */}
      <g fill="#FFD66B">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const r = 76;
          const cx = 100 + Math.cos(a) * r;
          const cy = 100 + Math.sin(a) * r;
          return <circle key={i} cx={cx} cy={cy} r="2.5" />;
        })}
      </g>
    </svg>
  );
}

/** Map a tile id → component, for ergonomic usage in showcases. */
export const LEAGUE_LOGOS = {
  "la-liga": LaLigaLogo,
  "premier-league": PremierLeagueLogo,
  bundesliga: BundesligaLogo,
  "serie-a": SerieALogo,
  "ligue-1": Ligue1Logo,
  nations: NationsLogo,
  "world-cup": WorldCupLogo,
  other: OtherLeaguesLogo,
} as const;
