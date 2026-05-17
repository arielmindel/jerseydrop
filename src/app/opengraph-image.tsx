import { ImageResponse } from "next/og";

// Removed `runtime = "edge"` — edge runtime sometimes returns 0-byte PNGs
// when the JSX includes mixed-direction Hebrew text + complex gradients.
// Node runtime renders reliably.
export const alt = "JerseyDrop — חולצות כדורגל רשמיות";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "64px 72px",
          backgroundColor: "#FFFFFF",
          color: "#0A0A0A",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#00B85F",
          }}
        >
          World Cup 2026
        </div>
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            lineHeight: 1,
            marginTop: 16,
            textTransform: "uppercase",
            color: "#0A0A0A",
          }}
        >
          JerseyDrop
        </div>
        <div
          style={{
            fontSize: 36,
            marginTop: 24,
            color: "#525252",
          }}
        >
          Official Football Jerseys · Israel
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 28,
            fontWeight: 700,
            color: "#00B85F",
          }}
        >
          jerseydrop.co.il
        </div>
      </div>
    ),
    { ...size },
  );
}
