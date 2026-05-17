"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Accessibility,
  ChevronLeft,
  Eye,
  HelpCircle,
  Highlighter,
  Info,
  Link2,
  MessageCircle,
  MousePointer2,
  Package,
  Pause,
  RefreshCw,
  RotateCw,
  Ruler,
  Settings2,
  Shirt,
  Truck,
  Type,
  X,
} from "lucide-react";
import { useAccessibility, TEXT_LABEL } from "@/hooks/useAccessibility";
import { whatsappLink } from "@/lib/constants";

/**
 * Floating utility menu — top-LEFT corner (RTL = visually less primary
 * side, doesn't compete with the cart/menu top-right). Opens a panel
 * with accessibility controls (Israeli law) + quick links to support
 * pages.
 *
 * Mobile: full-width bottom sheet.
 * Desktop: left-side drawer (w-[400px]).
 */

export default function AccessibilityMenu() {
  const a11y = useAccessibility();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Pulse only on first ~3 seconds, draws attention to the new icon
  useEffect(() => {
    const id = window.setTimeout(() => setPulse(false), 3000);
    return () => window.clearTimeout(id);
  }, []);

  // ESC closes panel + focus close button on open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (typeof document === "undefined") return;
    const orig = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = orig;
    return () => {
      document.body.style.overflow = orig;
    };
  }, [open]);

  const utilityLinks: {
    href: string;
    Icon: typeof Ruler;
    label: string;
    external?: boolean;
  }[] = [
    { href: "/size-chart", Icon: Ruler, label: "טבלת מידות" },
    {
      href: "/care-instructions",
      Icon: Shirt,
      label: "איך לכבס את החולצה",
    },
    { href: "/track-order", Icon: Package, label: "מעקב הזמנה" },
    {
      href: whatsappLink("היי, יש לי שאלה לגבי JerseyDrop"),
      Icon: MessageCircle,
      label: "צור קשר בוואטסאפ",
      external: true,
    },
    { href: "/faq", Icon: HelpCircle, label: "שאלות נפוצות" },
    { href: "/shipping", Icon: Truck, label: "מדיניות משלוחים" },
    { href: "/returns", Icon: RotateCw, label: "מדיניות החזרות" },
  ];

  return (
    <>
      {/* ============ FLOATING TRIGGER (top-LEFT) ============ */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="פתח תפריט נגישות ושימושי"
        title="תפריט שימושי ונגישות"
        className={`group fixed left-3 top-3 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#00B85F]/30 bg-background/80 text-[#00B85F] backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-[#00B85F]/60 hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B85F] focus-visible:ring-offset-2 focus-visible:ring-offset-background md:left-4 md:top-4 ${
          pulse ? "a11y-pulse" : ""
        }`}
      >
        <Settings2 className="h-6 w-6" />
        <span className="pointer-events-none absolute start-full ms-3 hidden whitespace-nowrap rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:inline-block">
          תפריט שימושי ונגישות
        </span>
      </button>

      {/* ============ BACKDROP ============ */}
      {open && (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm"
        />
      )}

      {/* ============ PANEL ============ */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="תפריט נגישות ושימושי"
        className={`fixed inset-x-0 bottom-0 z-[70] max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-background/95 backdrop-blur-xl transition-transform duration-300 ease-out md:inset-y-0 md:bottom-auto md:left-0 md:right-auto md:h-full md:max-h-none md:w-[400px] md:rounded-none md:border-r md:border-t-0 ${
          open
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:-translate-x-full"
        }`}
      >
        {/* HEADER */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <Settings2 className="h-5 w-5 text-[#00B85F]" />
            <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
              תפריט שימושי
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="סגור"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* CONTENT */}
        <div className="flex flex-col gap-8 px-5 py-6">
          {/* ===== ACCESSIBILITY ===== */}
          <section aria-labelledby="a11y-title">
            <header className="mb-4 flex items-center gap-2.5">
              <Accessibility className="h-5 w-5 text-[#00B85F]" />
              <h3
                id="a11y-title"
                className="font-display text-base font-bold uppercase tracking-wider text-foreground"
              >
                אפשרויות נגישות
              </h3>
            </header>

            <div className="space-y-2">
              {/* Text size cycle */}
              <button
                type="button"
                onClick={a11y.cycleTextSize}
                className="flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-border bg-foreground/[0.03] px-4 text-start text-base text-foreground transition-colors hover:border-border hover:bg-foreground/[0.06]"
              >
                <span className="flex items-center gap-2.5">
                  <Type className="h-4 w-4 text-[#00B85F]" />
                  הגדלת טקסט
                </span>
                <span className="rounded-full border border-[#00B85F]/30 bg-[#00B85F]/10 px-2.5 py-0.5 text-xs font-bold text-[#00B85F]">
                  {TEXT_LABEL[a11y.textSize]}
                </span>
              </button>

              <ToggleRow
                Icon={Eye}
                label="ניגודיות גבוהה"
                value={a11y.contrast}
                onToggle={a11y.toggleContrast}
              />
              <ToggleRow
                Icon={Pause}
                label="עצור אנימציות"
                value={a11y.motion}
                onToggle={a11y.toggleMotion}
              />
              <ToggleRow
                Icon={Highlighter}
                label="הדגש קישורים"
                value={a11y.links}
                onToggle={a11y.toggleLinks}
              />
              <ToggleRow
                Icon={MousePointer2}
                label="סמן מוגדל"
                value={a11y.cursor}
                onToggle={a11y.toggleCursor}
              />

              <button
                type="button"
                onClick={a11y.reset}
                className="mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                אפס הגדרות
              </button>

              <Link
                href="/accessibility"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex items-center gap-1 text-sm text-[#00B85F] underline-offset-4 hover:underline"
              >
                <Link2 className="h-3.5 w-3.5" />
                הצהרת נגישות מלאה ←
              </Link>
            </div>
          </section>

          {/* DIVIDER */}
          <div aria-hidden className="h-px bg-foreground/10" />

          {/* ===== USEFUL LINKS ===== */}
          <section aria-labelledby="useful-title">
            <header className="mb-4 flex items-center gap-2.5">
              <Info className="h-5 w-5 text-[#00B85F]" />
              <h3
                id="useful-title"
                className="font-display text-base font-bold uppercase tracking-wider text-foreground"
              >
                מידע שימושי
              </h3>
            </header>

            <ul className="space-y-1">
              {utilityLinks.map((l) => {
                const inner = (
                  <span className="flex h-14 w-full items-center justify-between gap-3 rounded-xl px-4 text-start text-base text-foreground transition-colors hover:bg-foreground/5">
                    <span className="flex items-center gap-3">
                      <l.Icon className="h-5 w-5 text-[#00B85F]" />
                      <span className="font-medium">{l.label}</span>
                    </span>
                    <ChevronLeft className="h-4 w-4 text-foreground/40" />
                  </span>
                );
                return (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link href={l.href} onClick={() => setOpen(false)}>
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </aside>

      {/* Pulse keyframes — scoped to the trigger button only */}
      <style jsx global>{`
        @keyframes a11y-pulse-kf {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(0,184,95, 0.55);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(0,184,95, 0);
          }
        }
        .a11y-pulse {
          animation: a11y-pulse-kf 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .a11y-pulse {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

function ToggleRow({
  Icon,
  label,
  value,
  onToggle,
}: {
  Icon: typeof Eye;
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={value}
      className="flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-border bg-foreground/[0.03] px-4 text-start text-base text-foreground transition-colors hover:border-border hover:bg-foreground/[0.06]"
    >
      <span className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-[#00B85F]" />
        {label}
      </span>
      <span
        className={`relative inline-block h-6 w-11 flex-shrink-0 rounded-full border transition-colors ${
          value
            ? "border-[#00B85F] bg-[#00B85F]/20"
            : "border-border bg-foreground/10"
        }`}
      >
        <span
          className={`absolute top-0.5 inline-block h-5 w-5 rounded-full bg-white transition-all duration-200 ${
            value ? "start-[1.5rem] bg-[#00B85F]" : "start-0.5"
          }`}
        />
      </span>
    </button>
  );
}
