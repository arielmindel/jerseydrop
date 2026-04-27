"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import InfiniteProductGrid from "./InfiniteProductGrid";

type Decade = "80s" | "90s" | "00s" | "10s" | "all";

const TABS: { id: Decade; label: string; range: string }[] = [
  { id: "all", label: "הכל", range: "" },
  { id: "80s", label: "שנות ה-80", range: "1980-1989" },
  { id: "90s", label: "שנות ה-90", range: "1990-1999" },
  { id: "00s", label: "שנות ה-00", range: "2000-2009" },
  { id: "10s", label: "שנות ה-10", range: "2010-2019" },
];

type Props = {
  byDecade: Record<"80s" | "90s" | "00s" | "10s", Product[]>;
  undated: Product[];
};

export default function RetroDecadeTabs({ byDecade, undated }: Props) {
  const [tab, setTab] = useState<Decade>("all");

  const products =
    tab === "all"
      ? [
          ...byDecade["10s"],
          ...byDecade["00s"],
          ...byDecade["90s"],
          ...byDecade["80s"],
          ...undated,
        ]
      : byDecade[tab];

  const counts: Record<Decade, number> = {
    all: byDecade["80s"].length + byDecade["90s"].length + byDecade["00s"].length + byDecade["10s"].length + undated.length,
    "80s": byDecade["80s"].length,
    "90s": byDecade["90s"].length,
    "00s": byDecade["00s"].length,
    "10s": byDecade["10s"].length,
  };

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Retro decade tabs"
        className="inline-flex flex-wrap rounded-full border border-border bg-surface p-1"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              title={t.range}
              className={`rounded-full px-5 py-2 font-display text-xs font-bold uppercase tracking-widest transition-all ${
                active
                  ? "bg-gold text-background shadow-gold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
              <span className="ms-1 text-[10px] opacity-80">
                ({counts[t.id]})
              </span>
            </button>
          );
        })}
      </div>

      <InfiniteProductGrid
        products={products}
        emptyHint="עוד לא הועלו פריטים מהעשור הזה."
      />
    </div>
  );
}
