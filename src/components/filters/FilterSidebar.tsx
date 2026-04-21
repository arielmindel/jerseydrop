"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { buildQueryString, PRICE_MAX, PRICE_MIN } from "@/lib/filters";

type Option = { value: string; labelHe: string; meta?: string };

export type FilterGroupConfig = {
  key: string;
  labelHe: string;
  type: "multi" | "price";
  options?: Option[];
};

type Props = {
  groups: FilterGroupConfig[];
  counts?: Record<string, number>;
};

export default function FilterSidebar({ groups, counts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getValues = (key: string): string[] =>
    (sp.get(key) || "").split(",").filter(Boolean);

  const toggleValue = (key: string, value: string) => {
    const values = getValues(key);
    const next = values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values, value];
    const qs = buildQueryString(new URLSearchParams(sp), {
      [key]: next.length ? next.join(",") : null,
    });
    router.push(`${pathname}${qs}`, { scroll: false });
  };

  const setPrice = (min: number, max: number) => {
    const qs = buildQueryString(new URLSearchParams(sp), {
      min: min === PRICE_MIN ? null : String(min),
      max: max === PRICE_MAX ? null : String(max),
    });
    router.push(`${pathname}${qs}`, { scroll: false });
  };

  const clearAll = () => {
    router.push(pathname, { scroll: false });
  };

  const activeCount = Array.from(sp.keys()).filter(
    (k) => !["sort", "page"].includes(k),
  ).length;

  const body = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-muted">
          פילטרים
          {activeCount > 0 && (
            <span className="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent/20 px-1 text-[10px] text-accent">
              {activeCount}
            </span>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="font-display text-[10px] font-bold uppercase tracking-widest text-muted hover:text-accent"
          >
            איפוס
          </button>
        )}
      </div>

      {groups.map((group) => {
        if (group.type === "price") {
          const min = Number(sp.get("min") || PRICE_MIN);
          const max = Number(sp.get("max") || PRICE_MAX);
          return (
            <div key={group.key} className="space-y-2">
              <div className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
                {group.labelHe}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>{min} ₪</span>
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={10}
                  value={max}
                  onChange={(e) => setPrice(min, Number(e.target.value))}
                  className="flex-1 accent-[#00FF88]"
                />
                <span>{max} ₪</span>
              </div>
              {(min !== PRICE_MIN || max !== PRICE_MAX) && (
                <button
                  className="text-[10px] text-muted underline hover:text-accent"
                  onClick={() => setPrice(PRICE_MIN, PRICE_MAX)}
                >
                  איפוס טווח
                </button>
              )}
            </div>
          );
        }

        const selected = getValues(group.key);
        return (
          <div key={group.key} className="space-y-2">
            <div className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
              {group.labelHe}
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {group.options?.map((opt) => {
                const active = selected.includes(opt.value);
                const count = counts?.[`${group.key}:${opt.value}`];
                return (
                  <li key={opt.value}>
                    <button
                      onClick={() => toggleValue(group.key, opt.value)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border bg-background text-muted hover:border-accent/40 hover:text-foreground"
                      }`}
                    >
                      {opt.labelHe}
                      {typeof count === "number" && (
                        <span className="text-[10px] text-muted/70">({count})</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 self-start rounded-2xl border border-border bg-surface/60 p-5 md:block">
        {body}
      </aside>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-xs font-semibold text-foreground md:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        פילטרים {activeCount > 0 && `(${activeCount})`}
      </button>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute inset-y-0 end-0 h-full w-80 max-w-full overflow-y-auto border-s border-border bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold uppercase tracking-tight">
                פילטרים
              </h3>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-full p-1 text-muted hover:bg-background"
                aria-label="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {body}
          </div>
        </div>
      )}
    </>
  );
}

