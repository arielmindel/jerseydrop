"use client";

import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/constants";

const DEFAULT_MESSAGE = "היי, יש לי שאלה לגבי JerseyDrop";

/**
 * Floating WhatsApp call-to-action — fixed bottom-left visually (start in
 * RTL terms), 56×56 round button with the official WhatsApp green and a
 * gentle 4-second pulse. Hidden on /checkout because the page is for
 * payment focus.
 */
export default function WhatsAppFloat() {
  const pathname = usePathname();
  if (pathname.startsWith("/checkout")) return null;

  return (
    <a
      href={whatsappLink(DEFAULT_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="צ'אט בוואטסאפ"
      className="group fixed bottom-6 start-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_8px_28px_rgba(37,211,102,0.45)] transition-all duration-200 hover:scale-105 hover:shadow-[0_12px_36px_rgba(37,211,102,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{
        animation: "wa-pulse 4s ease-in-out infinite",
      }}
    >
      {/* WhatsApp glyph — official lockup */}
      <svg
        className="h-7 w-7 fill-white"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.27-4.39c0-4.55 3.7-8.25 8.26-8.25 4.54 0 8.24 3.7 8.24 8.25 0 4.54-3.7 8.25-8.24 8.25zm4.52-6.18c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.13-.56.13-.16.25-.64.8-.78.96-.14.16-.29.18-.54.06-.25-.12-1.04-.39-1.99-1.23-.74-.66-1.23-1.47-1.37-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.24-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.31-.01-.47-.01s-.43.06-.66.31-.86.84-.86 2.05.88 2.38 1.01 2.55c.13.16 1.74 2.65 4.21 3.71.59.25 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.66-1.18.2-.58.2-1.07.14-1.18-.06-.11-.23-.18-.48-.31z" />
      </svg>

      {/* Tooltip on hover (md+) */}
      <span
        className="pointer-events-none absolute start-full ms-3 hidden rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:inline-block"
        style={{ whiteSpace: "nowrap" }}
      >
        צריכים עזרה? נדבר!
      </span>

      {/* Keyframes injected inline so the component is fully self-contained */}
      <style>{`
        @keyframes wa-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .group { animation: none !important; }
        }
      `}</style>
    </a>
  );
}
