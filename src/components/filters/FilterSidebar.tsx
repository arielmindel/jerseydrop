"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X, Search, ChevronDown } from "lucide-react";
import { buildQueryString, PRICE_MAX, PRICE_MIN } from "@/lib/filters";
import { normalizeText } from "@/lib/search";

type Option = { value: string; labelHe: string; meta?: string };

/** Serializable visibility rule. Client evaluates it against the URL-parsed
 *  active filter map. (Functions can't cross the Server→Client boundary.) */
export type VisibilityRule =
  | { key: string; equals: string }
  | { key: string; notEquals: string }
  | { key: string; in: string[] }
  | { key: string; empty: true }
  | { key: string; nonEmpty: true };

export type FilterGroupConfig = {
  key: string;
  labelHe: string;
  type: "multi" | "price" | "search-multi";
  options?: Option[];
  /** Collapse the group by default if it has many options (e.g. team list). */
  defaultCollapsed?: boolean;
  /** Hide the entire group when this rule fails (e.g. show league only when category=club). */
  visibleWhen?: VisibilityRule;
};

function evalVisibility(
  rule: VisibilityRule | undefined,
  active: Record<string, string[]>,
): boolean {
  if (!rule) return true;
  const values = active[rule.key] || [];
  if ("empty" in rule) return values.length === 0;
  if ("nonEmpty" in rule) return values.length > 0;
  if ("equals" in rule) return values.includes(rule.equals);
  if ("notEquals" in rule) return !values.includes(rule.notEquals);
  if ("in" in rule) return values.some((v) => rule.in.includes(v));
  return true;
}

type Props = {
  groups: FilterGroupConfig[];
  counts?: Record<string, number>;
  /** Total active filter dimensions (excluding sort/page) — controls badge. */
  activeCountOverride?: number;
};

export default function FilterSidebar({ groups, counts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getValues = (key: string): string[] =>
    (sp.get(key) || "").split(",").filter(Boolean);

  const activeMap = useMemo<Record<string, string[]>>(() => {
    const out: Record<string, string[]> = {};
    sp.forEach((v, k) => {
      out[k] = v.split(",").filter(Boolean);
    });
    return out;
  }, [sp]);

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
    (k) => !["sort", "page", "q"].includes(k),
  ).length;

  const visibleGroups = groups.filter((g) => evalVisibility(g.visibleWhen, activeMap));

  const body = (
    <div className="space-y-5">
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
            נקה הכל
          </button>
        )}
      </div>

      {visibleGroups.map((group) => (
        <FilterGroup
          key={group.key}
          group={group}
          selected={getValues(group.key)}
          counts={counts}
          onToggle={toggleValue}
          onSetPrice={setPrice}
          minPrice={Number(sp.get("min") || PRICE_MIN)}
          maxPrice={Number(sp.get("max") || PRICE_MAX)}
        />
      ))}
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
        סינון{" "}
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-accent-foreground">
            {activeCount}
          </span>
        )}
      </button>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold uppercase tracking-tight">
                סינון
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
            <div className="sticky bottom-0 -mx-5 mt-6 border-t border-border bg-surface p-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground"
              >
                הצג תוצאות
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// One filter group (handles multi / search-multi / price)
// ============================================================================

function FilterGroup({
  group,
  selected,
  counts,
  onToggle,
  onSetPrice,
  minPrice,
  maxPrice,
}: {
  group: FilterGroupConfig;
  selected: string[];
  counts?: Record<string, number>;
  onToggle: (key: string, value: string) => void;
  onSetPrice: (min: number, max: number) => void;
  minPrice: number;
  maxPrice: number;
}) {
  const [collapsed, setCollapsed] = useState(
    group.defaultCollapsed && selected.length === 0,
  );
  const [search, setSearch] = useState("");

  if (group.type === "price") {
    return (
      <div className="space-y-2">
        <div className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
          {group.labelHe}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{minPrice} ₪</span>
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={10}
            value={maxPrice}
            onChange={(e) => onSetPrice(minPrice, Number(e.target.value))}
            className="flex-1 accent-[#00FF88]"
          />
          <span>{maxPrice} ₪</span>
        </div>
        {(minPrice !== PRICE_MIN || maxPrice !== PRICE_MAX) && (
          <button
            className="text-[10px] text-muted underline hover:text-accent"
            onClick={() => onSetPrice(PRICE_MIN, PRICE_MAX)}
          >
            איפוס טווח
          </button>
        )}
      </div>
    );
  }

  const allOptions = group.options || [];
  const filteredOptions =
    group.type === "search-multi" && search
      ? allOptions.filter((o) =>
          normalizeText(`${o.labelHe} ${o.value}`).includes(
            normalizeText(search),
          ),
        )
      : allOptions;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between font-display text-xs font-bold uppercase tracking-widest text-foreground"
      >
        <span className="flex items-center gap-2">
          {group.labelHe}
          {selected.length > 0 && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/20 px-1 text-[10px] text-accent">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted transition-transform ${
            collapsed ? "" : "rotate-180"
          }`}
        />
      </button>
      {!collapsed && (
        <>
          {group.type === "search-multi" && allOptions.length > 12 && (
            <div className="relative">
              <Search className="pointer-events-none absolute end-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חפש בקבוצות…"
                className="h-8 w-full rounded-full border border-border bg-background ps-7 pe-3 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
          )}
          <ul
            className={`flex flex-wrap gap-1.5 ${
              group.type === "search-multi" ? "max-h-56 overflow-y-auto pe-1" : ""
            }`}
          >
            {filteredOptions.length === 0 && (
              <li className="text-[10px] text-muted">— לא נמצאו —</li>
            )}
            {filteredOptions.map((opt) => {
              const active = selected.includes(opt.value);
              const count = counts?.[`${group.key}:${opt.value}`];
              return (
                <li key={opt.value}>
                  <button
                    onClick={() => onToggle(group.key, opt.value)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border bg-background text-muted hover:border-accent/40 hover:text-foreground"
                    }`}
                  >
                    {opt.labelHe}
                    {typeof count === "number" && (
                      <span className="text-[10px] text-muted/70">
                        ({count})
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
