"use client";

import { Minus, Plus, Sparkles } from "lucide-react";

/** Three jersey "themes" the customer can request from a Mystery Box.
 *  We send the supplier the count + theme + size; they pick what's in stock. */
export type MysteryType = "retro" | "long-sleeve" | "special";

export const MYSTERY_TYPES: { id: MysteryType; labelHe: string; descriptionHe: string }[] = [
  {
    id: "retro",
    labelHe: "רטרו",
    descriptionHe: "חולצה קלאסית מ-80s/90s/00s — מועדון או נבחרת",
  },
  {
    id: "long-sleeve",
    labelHe: "ארוכה",
    descriptionHe: "חולצת שרוול ארוך — קלאסית, מודרנית או רטרו",
  },
  {
    id: "special",
    labelHe: "מיוחדת",
    descriptionHe: "מהדורה מיוחדת — אנימה, גרפיטי, או אספנים",
  },
];

const ADULT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
type AdultSize = (typeof ADULT_SIZES)[number];

const MAX_QTY = 10;

export type MysteryState = {
  type: MysteryType;
  size: AdultSize | null;
  quantity: number;
};

export const initialMystery: MysteryState = {
  type: "retro",
  size: null,
  quantity: 1,
};

/**
 * UI block shown on the product detail page ONLY for Mystery Box products
 * (priceTier === 'mystery'). Replaces the normal version selector + name/
 * number customization with a 3-control flow:
 *   1. Pick a theme (retro / long-sleeve / special)
 *   2. Pick a size (S–XXL)
 *   3. Pick a quantity (1–10)
 *
 * The selected theme is encoded into the cart line item's customerNotes
 * field by ProductDetail when adding to cart (e.g. "🎲 Mystery: רטרו"),
 * so admin sees exactly what to source from the supplier.
 */
export default function MysteryBoxControls({
  value,
  onChange,
}: {
  value: MysteryState;
  onChange: (next: MysteryState) => void;
}) {
  const dec = () =>
    onChange({ ...value, quantity: Math.max(1, value.quantity - 1) });
  const inc = () =>
    onChange({ ...value, quantity: Math.min(MAX_QTY, value.quantity + 1) });

  return (
    <div className="space-y-6">
      {/* ---- Type selector ---- */}
      <fieldset>
        <legend className="mb-2 flex items-center gap-1.5 font-display text-overline tracking-[0.18em] text-accent">
          <Sparkles className="h-3.5 w-3.5" /> סוג חולצה
        </legend>
        <div className="grid gap-2 md:grid-cols-3">
          {MYSTERY_TYPES.map((t) => {
            const selected = value.type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ ...value, type: t.id })}
                aria-pressed={selected}
                className={`group flex flex-col items-start gap-1 rounded-xl border p-3 text-start transition-all duration-base ease-emphasized active:translate-y-0 ${
                  selected
                    ? "border-accent bg-accent/10 shadow-glow-sm"
                    : "border-border bg-surface hover:-translate-y-0.5 hover:border-accent/40"
                }`}
              >
                <span className="font-display text-body-sm font-bold uppercase">
                  {t.labelHe}
                </span>
                <span className="text-caption leading-snug text-muted">
                  {t.descriptionHe}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ---- Size selector ---- */}
      <fieldset id="size-group">
        <legend className="mb-2 font-display text-overline tracking-[0.18em] text-muted">
          מידה
        </legend>
        <div className="flex flex-wrap gap-2">
          {ADULT_SIZES.map((s) => {
            const selected = value.size === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...value, size: s })}
                aria-pressed={selected}
                className={`font-display h-11 min-w-[52px] rounded-full border px-4 text-sm font-bold transition-all duration-fast ease-emphasized active:translate-y-0 ${
                  selected
                    ? "border-accent bg-accent/15 text-accent shadow-glow-sm"
                    : "border-border bg-surface text-foreground hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ---- Quantity stepper ---- */}
      <fieldset>
        <legend className="mb-2 font-display text-overline tracking-[0.18em] text-muted">
          כמות
        </legend>
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
          <button
            type="button"
            aria-label="הפחת"
            onClick={dec}
            disabled={value.quantity <= 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors duration-base hover:text-foreground disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center font-display text-body-lg font-bold tabular-nums">
            {value.quantity}
          </span>
          <button
            type="button"
            aria-label="הוסף"
            onClick={inc}
            disabled={value.quantity >= MAX_QTY}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors duration-base hover:text-foreground disabled:opacity-30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-caption text-muted">
          מקסימום {MAX_QTY} מיסטרי בוקס בהזמנה אחת.
        </p>
      </fieldset>
    </div>
  );
}

/** Format the mystery preference into a human-readable note that shows up
 *  on the cart line item + admin order detail. The note is what the team
 *  reads when picking the actual jersey from the supplier inventory. */
export function mysteryNote(state: MysteryState): string {
  const label =
    MYSTERY_TYPES.find((t) => t.id === state.type)?.labelHe || state.type;
  return `🎲 Mystery Box · סוג: ${label} · מידה: ${state.size || "—"}`;
}
