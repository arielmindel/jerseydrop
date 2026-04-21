"use client";

/**
 * Live SVG preview of a jersey back — updates as user types name/number.
 * Uses Oswald font for authentic football lettering.
 */
export default function JerseyPreview({
  name,
  number,
  jerseyColor = "#141414",
  accent = "#00FF88",
  textColor = "#FFFFFF",
}: {
  name: string;
  number: string;
  jerseyColor?: string;
  accent?: string;
  textColor?: string;
}) {
  const displayName = (name || "YOUR NAME").toUpperCase().slice(0, 12);
  const displayNumber = (number || "10").toString().slice(0, 2);

  return (
    <svg
      viewBox="0 0 320 380"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      role="img"
      aria-label={`תצוגה מקדימה: ${displayName} מספר ${displayNumber}`}
    >
      <defs>
        <linearGradient id="jerseyShade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={jerseyColor} stopOpacity="0.95" />
          <stop offset="1" stopColor={jerseyColor} stopOpacity="1" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Jersey body (back view) */}
      <path
        d="
          M 60 40
          L 110 20
          Q 160 10 210 20
          L 260 40
          L 286 80
          L 270 110
          L 240 96
          L 240 340
          Q 200 360 160 360
          Q 120 360 80 340
          L 80 96
          L 50 110
          L 34 80
          Z
        "
        fill="url(#jerseyShade)"
        stroke={accent}
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />
      {/* Collar */}
      <path
        d="M 135 22 Q 160 38 185 22 Q 174 14 160 14 Q 146 14 135 22 Z"
        fill={accent}
        opacity="0.9"
      />
      {/* Subtle panel line down the back */}
      <line
        x1="160"
        y1="40"
        x2="160"
        y2="340"
        stroke={accent}
        strokeOpacity="0.08"
        strokeDasharray="4 8"
      />
      {/* Player name */}
      <text
        x="160"
        y="150"
        textAnchor="middle"
        fill={textColor}
        style={{
          fontFamily: "var(--font-oswald), 'Oswald', 'Arial Black', sans-serif",
          fontWeight: 700,
          letterSpacing: "2px",
        }}
        fontSize={displayName.length > 8 ? 22 : 28}
        filter="url(#glow)"
      >
        {displayName}
      </text>
      {/* Jersey number */}
      <text
        x="160"
        y="260"
        textAnchor="middle"
        fill={textColor}
        style={{
          fontFamily: "var(--font-oswald), 'Oswald', 'Arial Black', sans-serif",
          fontWeight: 700,
        }}
        fontSize="110"
        filter="url(#glow)"
      >
        {displayNumber}
      </text>

      {/* Shoulder accent stripes */}
      <path d="M 92 32 L 62 42 L 56 62 Z" fill={accent} opacity="0.35" />
      <path d="M 228 32 L 258 42 L 264 62 Z" fill={accent} opacity="0.35" />
    </svg>
  );
}
