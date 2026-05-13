import type { Metadata, Viewport } from "next";
import { Heebo, Space_Grotesk, Oswald } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TrustBar from "@/components/layout/TrustBar";
import CantFindCTA from "@/components/layout/CantFindCTA";
import AccessibilityMenu from "@/components/layout/AccessibilityMenu";
import Clarity from "@/components/analytics/Clarity";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Toaster } from "sonner";
import MarqueeBanner from "@/components/layout/MarqueeBanner";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import Chatbot from "@/components/Chatbot";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/constants";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JerseyDrop — חולצות כדורגל אותנטיות | מועדונים, נבחרות, רטרו",
    template: "%s | JerseyDrop",
  },
  description:
    "חנות חולצות כדורגל מקוונת בישראל. 1,600+ חולצות מקוריות של כל המועדונים והנבחרות בעולם. שם, מספר ופאצ׳ים — חינם. משלוח 10-17 ימים מהיצרן.",
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
    url: SITE_URL,
    siteName: "JerseyDrop",
    title: "JerseyDrop — חולצות כדורגל רשמיות",
    description:
      "חולצות רשמיות לנבחרות ולמועדונים. התאמה אישית. משלוח לכל הארץ.",
    images: [
      {
        url: "/logo/logo-full.png",
        width: 1536,
        height: 1024,
        alt: "JerseyDrop — Wear the Culture",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JerseyDrop — חולצות כדורגל רשמיות",
    description:
      "חולצות רשמיות לנבחרות ולמועדונים. התאמה אישית. משלוח לכל הארץ.",
    images: ["/logo/logo-full.png"],
  },
  // Canonical here applies only to the homepage. Other pages override
  // via their own generateMetadata().
  alternates: {
    canonical: "/",
    languages: {
      he: "/",
      "he-IL": "/",
      "x-default": "/",
    },
  },
  applicationName: "JerseyDrop",
  authors: [{ name: "JerseyDrop" }],
  referrer: "origin-when-cross-origin",
  manifest: "/manifest.json",
  // Google Search Console / Bing Webmaster verification slots —
  // fill in the meta-tag values when the property is verified.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION }
      : undefined,
  },
  icons: {
    icon: [
      { url: "/logo/favicon-16.png", type: "image/png", sizes: "16x16" },
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
  url: SITE_URL,
  logo: `${SITE_URL}/opengraph-image`,
  sameAs: ["https://instagram.com/jerseydrop"],
  address: { "@type": "PostalAddress", addressCountry: "IL" },
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "JerseyDrop",
  url: SITE_URL,
  inLanguage: "he-IL",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/products?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  // Lets us read env(safe-area-inset-*) on iOS notched devices
  viewportFit: "cover",
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
          <MarqueeBanner />
          <Header />
          <main className="flex-1">{children}</main>
          <CantFindCTA />
          <TrustBar />
          <Footer />
        </div>
        <WhatsAppFloat />
        <Chatbot />
        <AccessibilityMenu />
        <Clarity />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        <Toaster
          richColors
          position="top-center"
          theme="dark"
          dir="rtl"
          toastOptions={{
            style: {
              fontFamily: "var(--font-heebo)",
              fontSize: "0.95rem",
            },
          }}
        />
      </body>
    </html>
  );
}
