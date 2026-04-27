"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Trophy, Star, Clock, Baby, Shirt, Layers } from "lucide-react";

/**
 * One-click chips above the products grid for the most common quick filters.
 * Each chip is just a styled <Link> to /products with a single param set; the
 * page re-renders on the server with the filter applied. The active chip
 * highlights when the URL already has that filter set.
 */

const CHIPS = [
  { key: "flag", value: "wc2026", label: "מונדיאל 2026", Icon: Trophy, accent: "text-gold border-gold/40 bg-gold/5 hover:bg-gold/10" },
  { key: "tag", value: "champions-league", label: "ליגת האלופות", Icon: Star, accent: "text-accent border-accent/40 bg-accent/5 hover:bg-accent/10" },
  { key: "flag", value: "retro", label: "רטרו", Icon: Clock, accent: "text-gold border-gold/40 bg-gold/5 hover:bg-gold/10" },
  { key: "flag", value: "kids", label: "ילדים", Icon: Baby, accent: "text-pink-300 border-pink-400/40 bg-pink-400/5 hover:bg-pink-400/10" },
  { key: "flag", value: "long-sleeve", label: "שרוול ארוך", Icon: Shirt, accent: "text-violet border-violet/40 bg-violet/5 hover:bg-violet/10" },
  { key: "flag", value: "short-suit", label: "סטים", Icon: Layers, accent: "text-cyan border-cyan/40 bg-cyan/5 hover:bg-cyan/10" },
];

export default function QuickFilterChips() {
  const pathname = usePathname();
  const sp = useSearchParams();

  return (
    <div className="-mx-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="mx-4 flex min-w-max items-center gap-2">
        {CHIPS.map((c) => {
          const current = (sp.get(c.key) || "").split(",").filter(Boolean);
          const active = current.includes(c.value);
          // Toggle: if active, build URL without this value; otherwise add it
          const next = active
            ? current.filter((v) => v !== c.value)
            : [...current, c.value];
          const params = new URLSearchParams(sp);
          if (next.length) params.set(c.key, next.join(","));
          else params.delete(c.key);
          const qs = params.toString();
          const href = `${pathname}${qs ? "?" + qs : ""}`;
          return (
            <li key={`${c.key}-${c.value}`}>
              <Link
                href={href}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 font-display text-xs font-bold uppercase tracking-wide transition-colors ${
                  active
                    ? "border-accent bg-accent/15 text-accent shadow-glow-sm"
                    : c.accent
                }`}
              >
                <c.Icon className="h-3.5 w-3.5" />
                {c.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
