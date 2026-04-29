"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Quick filter chips for team pages — toggle between common views without
 * opening the full sidebar. Each chip is a styled <Link> that mutates one
 * URL param; the server re-renders with the filter applied.
 */
const CHIPS: { label: string; key: string; value: string | null }[] = [
  { label: "הכל", key: "_clear", value: null },
  { label: "2025-26", key: "season", value: "2025-26" },
  { label: "2024-25", key: "season", value: "2024-25" },
  { label: "רטרו", key: "flag", value: "retro" },
  { label: "בית", key: "type", value: "home" },
  { label: "חוץ", key: "type", value: "away" },
  { label: "ילדים", key: "flag", value: "kids" },
];

export default function TeamQuickChips() {
  const pathname = usePathname();
  const sp = useSearchParams();

  return (
    <div className="-mx-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="mx-4 flex min-w-max items-center gap-2">
        {CHIPS.map((c) => {
          if (c.key === "_clear") {
            // No URL params at all (or only a sort param if user picked one)
            const onlySort =
              !Array.from(sp.keys()).some((k) => k !== "sort");
            const href = sp.get("sort")
              ? `${pathname}?sort=${sp.get("sort")}`
              : pathname;
            return (
              <li key="all">
                <Link
                  href={href}
                  className={`inline-flex h-9 items-center rounded-full border px-4 font-display text-xs font-bold uppercase tracking-wide transition-colors ${
                    onlySort
                      ? "border-accent bg-accent/15 text-accent shadow-glow-sm"
                      : "border-border text-muted hover:border-accent/40 hover:text-accent"
                  }`}
                >
                  {c.label}
                </Link>
              </li>
            );
          }
          const current = (sp.get(c.key) || "").split(",").filter(Boolean);
          const active = current.includes(c.value!);
          const next = active
            ? current.filter((v) => v !== c.value)
            : [...current, c.value!];
          const params = new URLSearchParams(sp);
          if (next.length) params.set(c.key, next.join(","));
          else params.delete(c.key);
          const qs = params.toString();
          const href = `${pathname}${qs ? "?" + qs : ""}`;
          return (
            <li key={`${c.key}-${c.value}`}>
              <Link
                href={href}
                className={`inline-flex h-9 items-center rounded-full border px-4 font-display text-xs font-bold uppercase tracking-wide transition-colors ${
                  active
                    ? "border-accent bg-accent/15 text-accent shadow-glow-sm"
                    : "border-border text-muted hover:border-accent/40 hover:text-accent"
                }`}
              >
                {c.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
