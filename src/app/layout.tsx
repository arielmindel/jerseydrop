import type { Metadata, Viewport } from "next";
import { Heebo, Space_Grotesk, Oswald } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import JsonLd from "@/components/seo/JsonLd";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "600", "700", "900"],
  variable: "--font-heebo",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jerseydrop.co.il"),
  title: {
    default: "JerseyDrop — חולצות כדורגל רשמיות | מונדיאל 2026",
    template: "%s | JerseyDrop",
  },
  description:
    "חולצות רשמיות לנבחרות ולמועדונים. גרסת Fan ו-Player, התאמה אישית של שם ומספר, משלוח לכל הארץ.",
  keywords: [
    "חולצות כדורגל",
    "מונדיאל 2026",
    "ארגנטינה",
    "ברזיל",
    "ריאל מדריד",
    "ברצלונה",
    "JerseyDrop",
  ],
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: "https://jerseydrop.co.il",
    siteName: "JerseyDrop",
    title: "JerseyDrop — חולצות כדורגל רשמיות",
    description:
      "חולצות רשמיות לנבחרות ולמועדונים. התאמה אישית. משלוח לכל הארץ.",
  },
  twitter: {
    card: "summary_large_image",
    title: "JerseyDrop — חולצות כדורגל רשמיות",
    description:
      "חולצות רשמיות לנבחרות ולמועדונים. התאמה אישית. משלוח לכל הארץ.",
  },
  alternates: { canonical: "https://jerseydrop.co.il" },
  icons: {
    icon: [
      { url: "/logo/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/logo/favicon-64.png", type: "image/png", sizes: "64x64" },
      { url: "/logo/favicon-96.png", type: "image/png", sizes: "96x96" },
      { url: "/logo/logo-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/logo/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/logo/favicon-96.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "JerseyDrop",
  alternateName: "ג׳רסי-דרופ",
  url: "https://jerseydrop.co.il",
  logo: "https://jerseydrop.co.il/opengraph-image",
  sameAs: ["https://instagram.com/jerseydrop"],
  address: { "@type": "PostalAddress", addressCountry: "IL" },
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "JerseyDrop",
  url: "https://jerseydrop.co.il",
  inLanguage: "he-IL",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://jerseydrop.co.il/products?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${spaceGrotesk.variable} ${oswald.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <JsonLd data={ORGANIZATION_LD} />
        <JsonLd data={WEBSITE_LD} />
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
