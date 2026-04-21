"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { SORT_OPTIONS, buildQueryString, type SortKey } from "@/lib/filters";

export default function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = (sp.get("sort") as SortKey) || "popularity";

  return (
    <label className="relative inline-flex items-center gap-2 text-sm text-muted">
      <span className="hidden sm:inline">מיון:</span>
      <div className="relative">
        <select
          value={current}
          onChange={(e) => {
            const qs = buildQueryString(new URLSearchParams(sp), {
              sort: e.target.value === "popularity" ? null : e.target.value,
            });
            router.push(`${pathname}${qs}`, { scroll: false });
          }}
          className="h-10 appearance-none rounded-full border border-border bg-surface py-0 ps-4 pe-9 text-sm text-foreground transition-colors hover:border-accent/40 focus:border-accent focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.labelHe}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    </label>
  );
}
