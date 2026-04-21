import { ImageResponse } from "next/og";

export const runtime = "edge";
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
          backgroundColor: "#0A0A0A",
          backgroundImage:
            "radial-gradient(1000px 500px at 80% -20%, rgba(0,255,136,0.25), transparent 60%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#00FF88",
          }}
        >
          World Cup 2026
        </div>
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            lineHeight: 1,
            marginTop: 16,
            textTransform: "uppercase",
          }}
        >
          JerseyDrop
        </div>
        <div
          style={{
            fontSize: 40,
            marginTop: 24,
            color: "#A3A3A3",
            maxWidth: 900,
          }}
        >
          חולצות רשמיות לנבחרות ולמועדונים · משלוח לכל הארץ
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 28,
            fontWeight: 700,
            display: "flex",
            gap: 16,
            color: "#00FF88",
          }}
        >
          <span>jerseydrop.co.il</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
