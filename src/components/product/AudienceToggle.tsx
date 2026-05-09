"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Users, User, Baby } from "lucide-react";

/**
 * Segmented "audience" picker shown above product grids on every browse
 * page (כל החולצות, קבוצות, ליגות, נבחרות, אוספים, חיפוש). NOT shown on
 * /kids — that page is already audience-locked.
 *
 * Driven by the `audience` URL param. Empty = both, "adult" = only adults,
 * "kids" = only kids. The matching backend filter lives in src/lib/filters.ts.
 */

type Option = {
  value: "" | "adult" | "kids";
  labelHe: string;
  sub: string;
  Icon: typeof Users;
};

const OPTIONS: Option[] = [
  { value: "", labelHe: "הכל", sub: "מבוגרים + ילדים", Icon: Users },
  { value: "adult", labelHe: "מבוגרים", sub: "S–XXL", Icon: User },
  { value: "kids", labelHe: "ילדים", sub: "16–28", Icon: Baby },
];

export default function AudienceToggle() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = sp.get("audience") || "";

  return (
    <div className="mb-3">
      <div className="mb-1.5 font-display text-overline tracking-[0.18em] text-muted">
        מי לובש?
      </div>
      <div
        role="tablist"
        aria-label="בחירת קהל"
        className="inline-flex w-full max-w-xl items-stretch overflow-hidden rounded-full border border-border bg-surface p-1 sm:w-auto"
      >
        {OPTIONS.map((opt) => {
          const active = current === opt.value;
          const params = new URLSearchParams(sp);
          if (opt.value) params.set("audience", opt.value);
          else params.delete("audience");
          // When audience changes, drop the size filter — the available
          // sizes are different between adults and kids.
          params.delete("size");
          const qs = params.toString();
          const href = `${pathname}${qs ? "?" + qs : ""}`;
          return (
            <Link
              key={opt.value}
              role="tab"
              aria-selected={active}
              href={href}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 font-display text-sm font-bold uppercase tracking-wide transition-all duration-base ease-emphasized sm:px-5 ${
                active
                  ? "bg-accent text-background shadow-glow-sm"
                  : "text-muted hover:bg-accent/10 hover:text-foreground"
              }`}
            >
              <opt.Icon className="h-4 w-4" />
              <span>{opt.labelHe}</span>
              <span
                className={`hidden text-[0.625rem] font-normal tracking-normal sm:inline ${
                  active ? "text-background/80" : "text-muted/80"
                }`}
              >
                ({opt.sub})
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
