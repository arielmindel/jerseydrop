import Image from "next/image";
import Link from "next/link";
import { Instagram, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/constants";

/**
 * Minimal three-column footer for JerseyDrop.
 *
 * COL 1 — brand block: logo + tagline + social icons (Instagram, TikTok, WhatsApp)
 * COL 2 — quick navigation links
 * COL 3 — legal links
 *
 * Bottom bar: copyright + payment-method badges (Visa, Mastercard, Bit, PayPal).
 *
 * Mobile: stacks vertically with bigger tap targets (min h-11) and 16px text.
 * Safe-area inset for iOS notch on the bottom bar.
 */

const QUICK_LINKS: { href: string; labelHe: string }[] = [
  { href: "/products?category=club", labelHe: "חולצות מועדונים" },
  { href: "/products?category=national", labelHe: "חולצות נבחרות" },
  { href: "/retro", labelHe: "רטרו" },
  { href: "/collections/special", labelHe: "מיוחדות" },
  { href: "/contact", labelHe: "צור קשר" },
];

const LEGAL_LINKS: { href: string; labelHe: string }[] = [
  { href: "/contact", labelHe: "מדיניות החזרות" },
  { href: "/terms", labelHe: "תנאי שימוש" },
  { href: "/privacy", labelHe: "מדיניות פרטיות" },
  { href: "/terms", labelHe: "תקנון אתר" },
];

// TikTok glyph as inline SVG — Lucide doesn't ship a TikTok icon yet.
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M19.6 6.7a5.4 5.4 0 0 1-3.2-1 5.4 5.4 0 0 1-2-3v9.7a4.4 4.4 0 1 1-4.4-4.4c.3 0 .5 0 .8.1v2.7a1.7 1.7 0 1 0 1.2 1.6V2h2.5a5.4 5.4 0 0 0 .1.9 5.4 5.4 0 0 0 2.5 3.6 5.4 5.4 0 0 0 2.5.7v2.5z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black/95 text-white/80">
      {/* Top hairline accent — keeps the visual link with the header */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"
      />

      <div className="container relative grid gap-12 py-12 md:grid-cols-3 md:gap-10 md:py-16">
        {/* ============ COL 1 — BRAND ============ */}
        <div className="space-y-5">
          <Link href="/" aria-label="JerseyDrop — דף הבית" className="inline-block">
            <Image
              src="/logo/logo-256.png"
              alt="JerseyDrop"
              width={256}
              height={256}
              className="h-14 w-auto"
            />
          </Link>
          <p className="max-w-xs text-base leading-relaxed text-white/70">
            חולצות כדורגל אותנטיות, ישר אליך.
          </p>
          <div className="flex gap-2 pt-1">
            <a
              href="https://instagram.com/jersey.drop1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00FF88] hover:bg-[#00FF88]/10 hover:text-[#00FF88]"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="TikTok (בקרוב)"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00FF88] hover:bg-[#00FF88]/10 hover:text-[#00FF88]"
            >
              <TikTokIcon className="h-5 w-5" />
            </a>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00FF88] hover:bg-[#00FF88]/10 hover:text-[#00FF88]"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* ============ COL 2 — QUICK NAV ============ */}
        <div>
          <h4 className="mb-5 font-display text-overline font-bold uppercase tracking-[0.18em] text-[#00FF88]">
            ניווט מהיר
          </h4>
          <ul className="space-y-3 text-base">
            {QUICK_LINKS.map((l) => (
              <li key={l.labelHe}>
                <Link
                  href={l.href}
                  className="inline-flex h-8 items-center text-white/80 transition-colors duration-150 hover:text-[#00FF88]"
                >
                  {l.labelHe}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ============ COL 3 — LEGAL ============ */}
        <div>
          <h4 className="mb-5 font-display text-overline font-bold uppercase tracking-[0.18em] text-[#00FF88]">
            מידע
          </h4>
          <ul className="space-y-3 text-base">
            {LEGAL_LINKS.map((l) => (
              <li key={l.labelHe}>
                <Link
                  href={l.href}
                  className="inline-flex h-8 items-center text-white/80 transition-colors duration-150 hover:text-[#00FF88]"
                >
                  {l.labelHe}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ============ BOTTOM BAR ============ */}
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm text-white/55 md:flex-row md:py-5">
          <span>© 2026 JerseyDrop. כל הזכויות שמורות.</span>
          <div
            aria-label="אמצעי תשלום מקובלים"
            className="flex flex-wrap items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.18em]"
          >
            <span className="rounded border border-white/15 px-3 py-1.5 text-white/75">
              VISA
            </span>
            <span className="rounded border border-white/15 px-3 py-1.5 text-white/75">
              MASTERCARD
            </span>
            <span className="rounded border border-white/15 px-3 py-1.5 text-white/75">
              ביט
            </span>
            <span className="rounded border border-white/15 px-3 py-1.5 text-white/75">
              PAYPAL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
