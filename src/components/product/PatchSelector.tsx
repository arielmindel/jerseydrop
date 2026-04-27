"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import type { Patch } from "@/lib/patches";

type Props = {
  patches: Patch[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function PatchSelector({
  patches,
  selectedId,
  onSelect,
}: Props) {
  if (patches.length <= 1) return null; // only the default "no-patch" — no choice to make

  return (
    <fieldset>
      <legend className="mb-2 flex items-center justify-between font-display text-xs font-bold uppercase tracking-widest text-muted">
        פאצ׳ <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent">חינם</span>
      </legend>
      <div role="radiogroup" aria-label="פאצ׳ לחולצה" className="grid gap-2">
        {patches.map((p) => {
          const isSelected = p.id === selectedId;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(p.id)}
              className={`group flex items-center gap-3 rounded-xl border p-3 text-start transition-all duration-200 ${
                isSelected
                  ? "border-accent bg-accent/10 shadow-glow-sm"
                  : "border-border bg-surface hover:border-accent/40"
              }`}
            >
              <div
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background ${
                  isSelected ? "border-accent/60" : "border-border"
                }`}
              >
                <Image
                  src={p.iconUrl}
                  alt={p.nameHe}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-display text-sm font-bold uppercase tracking-tight text-foreground">
                  {p.nameHe}
                </span>
                <span className="font-display text-[10px] uppercase tracking-widest text-muted">
                  {p.nameEn}
                </span>
              </div>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest text-accent">
                חינם
              </span>
              {isSelected && (
                <Check className="h-4 w-4 text-accent" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
