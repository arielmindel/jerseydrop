import Image from "next/image";
import Link from "next/link";
import { Instagram, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/constants";

/**
 * 4-column premium footer.
 *
 * COL 1 — brand block: logo + tagline + Instagram / TikTok / WhatsApp
 * COL 2 — ניווט מהיר (catalog navigation)
 * COL 3 — מידע ושירות (info + support)
 * COL 4 — משפטי (legal pages)
 *
 * Bottom bar: copyright + payment-method badges.
 *
 * Mobile: stacks vertically with bigger tap targets and 16px text.
 * Safe-area inset for iOS notched devices on the bottom bar.
 */

const NAV_LINKS: { href: string; labelHe: string }[] = [
  { href: "/products", labelHe: "כל החולצות" },
  { href: "/products?category=club", labelHe: "חולצות מועדונים" },
  { href: "/products?category=national", labelHe: "חולצות נבחרות" },
  { href: "/retro", labelHe: "רטרו" },
  { href: "/collections/special", labelHe: "מיוחדות" },
  { href: "/kids", labelHe: "ילדים" },
];

const INFO_LINKS: { href: string; labelHe: string }[] = [
  { href: "/about", labelHe: "אודותינו" },
  { href: "/shipping", labelHe: "מדיניות משלוחים" },
  { href: "/returns", labelHe: "מדיניות החזרות" },
  { href: "/contact", labelHe: "צור קשר" },
  { href: "/faq", labelHe: "שאלות נפוצות" },
];

const LEGAL_LINKS: { href: string; labelHe: string }[] = [
  { href: "/terms", labelHe: "תנאי שימוש" },
  { href: "/privacy", labelHe: "מדיניות פרטיות" },
  { href: "/policy", labelHe: "תקנון אתר" },
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

function FooterLinks({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; labelHe: string }[];
}) {
  return (
    <div>
      <h4 className="mb-5 font-display text-overline font-bold uppercase tracking-[0.18em] text-[#00FF88]">
        {heading}
      </h4>
      <ul className="space-y-3 text-base">
        {links.map((l) => (
          <li key={`${heading}-${l.labelHe}`}>
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
  );
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border-subtle bg-surface-2 text-white/80 backdrop-blur">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"
      />

      <div className="container relative grid gap-10 py-12 md:grid-cols-2 md:gap-10 md:py-16 lg:grid-cols-4 lg:gap-8">
        {/* COL 1 — BRAND */}
        <div className="space-y-5">
          <Link href="/" aria-label="JerseyDrop — דף הבית" className="inline-block">
            <Image
              src="/logo/logo-wordmark.png"
              alt="JerseyDrop"
              width={400}
              height={112}
              className="h-12 w-auto"
            />
          </Link>
          <p className="max-w-xs text-base leading-relaxed text-white/70">
            חולצות כדורגל אותנטיות, ישר אליך
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

        <FooterLinks heading="ניווט מהיר" links={NAV_LINKS} />
        <FooterLinks heading="מידע ושירות" links={INFO_LINKS} />
        <FooterLinks heading="משפטי" links={LEGAL_LINKS} />
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs text-white/55 md:flex-row md:py-5 md:text-sm">
          <span>© 2026 JerseyDrop. כל הזכויות שמורות.</span>
          <div
            aria-label="אמצעי תשלום מקובלים"
            className="flex flex-wrap items-center justify-center gap-1.5 opacity-80 transition-opacity hover:opacity-100 md:gap-2"
          >
            {[
              { src: "/icons/payments/visa.svg", alt: "Visa" },
              { src: "/icons/payments/mastercard.svg", alt: "Mastercard" },
              { src: "/icons/payments/amex.svg", alt: "American Express" },
              { src: "/icons/payments/diners.svg", alt: "Diners" },
              { src: "/icons/payments/isracard.svg", alt: "Isracard" },
              { src: "/icons/payments/apple-pay.svg", alt: "Apple Pay" },
              { src: "/icons/payments/google-pay.svg", alt: "Google Pay" },
              { src: "/icons/payments/bit.svg", alt: "Bit" },
            ].map((p) => (
              <Image
                key={p.alt}
                src={p.src}
                alt={p.alt}
                width={36}
                height={24}
                className="h-6 w-auto md:h-7"
              />
            ))}
            <span className="ms-1 inline-flex items-center rounded-full border border-white/20 px-2.5 py-1 font-display text-[10px] font-bold tracking-wide text-white/85 md:text-[11px]">
              עד 12 תשלומים
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
