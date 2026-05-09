"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Minus,
  Check,
  Gift,
  Trash2,
  User,
  Baby,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatILS } from "@/lib/utils";
import {
  MYSTERY_TYPES,
  type MysteryType,
} from "@/components/product/MysteryBoxControls";

const ADULT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
const KIDS_SIZES = ["16", "18", "20", "22", "24", "26", "28"] as const;
type Audience = "adult" | "kids";

const COLORS: { id: string; labelHe: string; swatch: string }[] = [
  { id: "black", labelHe: "שחור", swatch: "#0a0a0a" },
  { id: "white", labelHe: "לבן", swatch: "#f5f5f5" },
  { id: "red", labelHe: "אדום", swatch: "#dc2626" },
  { id: "blue", labelHe: "כחול", swatch: "#2563eb" },
  { id: "sky", labelHe: "תכלת", swatch: "#0ea5e9" },
  { id: "green", labelHe: "ירוק", swatch: "#16a34a" },
  { id: "yellow", labelHe: "צהוב", swatch: "#eab308" },
  { id: "orange", labelHe: "כתום", swatch: "#f97316" },
  { id: "purple", labelHe: "סגול", swatch: "#7c3aed" },
  { id: "pink", labelHe: "ורוד", swatch: "#ec4899" },
  { id: "gray", labelHe: "אפור", swatch: "#6b7280" },
];

type Slot = {
  uid: string;
  type: MysteryType | null;
  audience: Audience;
  size: string | null;
};

function newSlot(): Slot {
  return {
    uid: Math.random().toString(36).slice(2, 9),
    type: null,
    audience: "adult",
    size: null,
  };
}

/** Inputs come from the server page so we don't have to ship the catalog
 *  to the client. The "canonical" mystery product anchors the cart line
 *  (image, name, ids); per-jersey type/audience/size + global dislikes
 *  live in customerNotes. */
export type MysteryBoxBuilderProps = {
  productId: string;
  slug: string;
  nameHe: string;
  nameEn: string;
  team: string;
  image: string;
  unitPrice: number;
};

export default function MysteryBoxBuilder(props: MysteryBoxBuilderProps) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const setOpen = useCart((s) => s.setOpen);

  const [slots, setSlots] = useState<Slot[]>([newSlot()]);
  const [dislikedColors, setDislikedColors] = useState<string[]>([]);
  const [dislikedTeams, setDislikedTeams] = useState("");
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const quantity = slots.length;
  const total = props.unitPrice * quantity;

  const allConfigured = slots.every((s) => s.type !== null && s.size !== null);
  const firstUnconfiguredIdx = useMemo(
    () => slots.findIndex((s) => !s.type || !s.size),
    [slots],
  );

  const inc = () => setSlots((prev) => [...prev, newSlot()]);
  const dec = () => {
    if (quantity <= 1) return;
    setSlots((prev) => prev.slice(0, -1));
  };
  const removeAt = (uid: string) => {
    if (quantity <= 1) return;
    setSlots((prev) => prev.filter((s) => s.uid !== uid));
  };
  const updateSlot = (uid: string, patch: Partial<Slot>) => {
    setSlots((prev) => prev.map((s) => (s.uid === uid ? { ...s, ...patch } : s)));
  };
  const switchAudience = (uid: string, audience: Audience) => {
    // Reset size when switching adult <-> kids since the size grid changes.
    setSlots((prev) =>
      prev.map((s) => (s.uid === uid ? { ...s, audience, size: null } : s)),
    );
  };
  const toggleColor = (id: string) => {
    setDislikedColors((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const buildNote = (slot: Slot, count: number): string => {
    const typeLabel =
      MYSTERY_TYPES.find((t) => t.id === slot.type)?.labelHe || slot.type;
    const audienceLabel = slot.audience === "kids" ? "ילדים" : "בוגרים";
    const parts = [
      `🎲 Mystery Box${count > 1 ? ` ×${count}` : ""}`,
      `קהל: ${audienceLabel}`,
      `סוג: ${typeLabel}`,
      `מידה: ${slot.size}`,
    ];
    if (dislikedColors.length) {
      const colorLabels = dislikedColors
        .map((id) => COLORS.find((c) => c.id === id)?.labelHe || id)
        .join(", ");
      parts.push(`בלי צבעים: ${colorLabels}`);
    }
    const teams = dislikedTeams.trim();
    if (teams) parts.push(`בלי קבוצות: ${teams}`);
    return parts.join(" · ");
  };

  const addToCart = (buyNow = false) => {
    if (!allConfigured) {
      if (firstUnconfiguredIdx >= 0) {
        document
          .getElementById(`mystery-slot-${firstUnconfiguredIdx}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setAdding(true);
    // Group identical (audience+type+size) slots so the cart shows e.g. "x3"
    // not 3 lines. Different combos become separate lines.
    const groups = new Map<string, { slot: Slot; count: number }>();
    for (const s of slots) {
      if (!s.type || !s.size) continue;
      const key = `${s.audience}|${s.type}|${s.size}`;
      const existing = groups.get(key);
      if (existing) existing.count += 1;
      else groups.set(key, { slot: s, count: 1 });
    }
    for (const g of Array.from(groups.values())) {
      addItem({
        productId: props.productId,
        slug: props.slug,
        nameHe: props.nameHe,
        nameEn: props.nameEn,
        team: props.team,
        image: props.image,
        version: "fan",
        size: g.slot.size as never,
        unitPrice: props.unitPrice,
        customization: null,
        selectedPatchId: null,
        customerNotes: buildNote(g.slot, g.count),
        quantity: g.count,
      });
    }
    setTimeout(() => {
      setAdding(false);
      if (buyNow) router.push("/checkout");
      else {
        setJustAdded(true);
        setOpen(true);
        setTimeout(() => setJustAdded(false), 1500);
      }
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* ============ Quantity header ============ */}
      <div className="rounded-3xl border border-amber/40 bg-amber/5 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-amber" />
              <span className="font-display text-overline tracking-[0.18em] text-amber">
                בנו את הקופסה שלכם
              </span>
            </div>
            <h2 className="mt-1 font-display text-h2 font-black uppercase">
              כמה חולצות?
            </h2>
            <p className="mt-1 text-body-sm text-muted">
              {formatILS(props.unitPrice)} לחולצה · ללא הגבלה
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
            <button
              type="button"
              aria-label="הפחת"
              onClick={dec}
              disabled={quantity <= 1}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors duration-base hover:bg-amber/10 hover:text-amber disabled:opacity-30"
            >
              <Minus className="h-5 w-5" />
            </button>
            <span className="w-12 text-center font-display text-h2 font-black tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="הוסף"
              onClick={inc}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber text-background shadow-gold transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ============ Per-jersey configurator cards ============ */}
      <div className="space-y-4">
        {slots.map((slot, i) => {
          const isConfigured = slot.type !== null && slot.size !== null;
          const sizes = slot.audience === "kids" ? KIDS_SIZES : ADULT_SIZES;
          return (
            <div
              key={slot.uid}
              id={`mystery-slot-${i}`}
              className={`rounded-2xl border p-5 transition-all duration-base ease-emphasized ${
                isConfigured
                  ? "border-accent/40 bg-surface/80 shadow-glow-sm"
                  : "border-border bg-surface"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full font-display text-body-sm font-black ${
                      isConfigured
                        ? "bg-accent text-background"
                        : "bg-amber/15 text-amber"
                    }`}
                  >
                    {isConfigured ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className="font-display text-body font-bold uppercase">
                    חולצה #{i + 1}
                  </span>
                </div>
                {quantity > 1 && (
                  <button
                    type="button"
                    aria-label={`הסר חולצה ${i + 1}`}
                    onClick={() => removeAt(slot.uid)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-base hover:bg-destructive/15 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Audience: בוגרים / ילדים */}
              <fieldset>
                <legend className="mb-2 font-display text-overline tracking-[0.18em] text-muted">
                  למי החולצה?
                </legend>
                <div className="grid gap-2 grid-cols-2">
                  {(
                    [
                      { id: "adult", labelHe: "בוגרים", sub: "S–XXL", Icon: User },
                      { id: "kids", labelHe: "ילדים", sub: "16–28", Icon: Baby },
                    ] as const
                  ).map((opt) => {
                    const selected = slot.audience === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => switchAudience(slot.uid, opt.id)}
                        aria-pressed={selected}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-3 transition-all duration-base ease-emphasized ${
                          selected
                            ? "border-accent bg-accent/10 shadow-glow-sm"
                            : "border-border bg-background hover:-translate-y-0.5 hover:border-accent/40"
                        }`}
                      >
                        <opt.Icon className="h-4 w-4" />
                        <span className="font-display text-body-sm font-bold uppercase">
                          {opt.labelHe}
                        </span>
                        <span className="text-caption text-muted">({opt.sub})</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Type */}
              <fieldset className="mt-4">
                <legend className="mb-2 flex items-center gap-1.5 font-display text-overline tracking-[0.18em] text-accent">
                  <Sparkles className="h-3.5 w-3.5" /> סוג חולצה
                </legend>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                  {MYSTERY_TYPES.map((t) => {
                    const selected = slot.type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => updateSlot(slot.uid, { type: t.id })}
                        aria-pressed={selected}
                        className={`group flex flex-col items-start gap-1 rounded-xl border p-3 text-start transition-all duration-base ease-emphasized active:translate-y-0 ${
                          selected
                            ? "border-accent bg-accent/10 shadow-glow-sm"
                            : "border-border bg-background hover:-translate-y-0.5 hover:border-accent/40"
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

              {/* Size — depends on audience */}
              <fieldset className="mt-4">
                <legend className="mb-2 font-display text-overline tracking-[0.18em] text-muted">
                  מידה ({slot.audience === "kids" ? "ילדים" : "בוגרים"})
                </legend>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const selected = slot.size === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateSlot(slot.uid, { size: s })}
                        aria-pressed={selected}
                        className={`font-display h-11 min-w-[52px] rounded-full border px-4 text-sm font-bold transition-all duration-fast ease-emphasized active:translate-y-0 ${
                          selected
                            ? "border-accent bg-accent/15 text-accent shadow-glow-sm"
                            : "border-border bg-background text-foreground hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          );
        })}

        {/* Quick "add another" button below the cards */}
        <button
          type="button"
          onClick={inc}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/50 p-4 font-display text-body-sm font-bold uppercase text-muted transition-all duration-base hover:border-amber/50 hover:bg-amber/5 hover:text-amber"
        >
          <Plus className="h-4 w-4" />
          הוסף עוד חולצה
        </button>
      </div>

      {/* ============ Global preferences ============ */}
      <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
        <h3 className="font-display text-body-lg font-black uppercase">
          העדפות לכל ההזמנה
        </h3>
        <p className="mt-1 text-caption text-muted">
          אופציונלי — נשתדל לא לשים לכם משהו שאתם לא אוהבים.
        </p>

        {/* Disliked colors */}
        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-display text-overline tracking-[0.18em] text-muted">
              צבעים שאתם פחות אוהבים
            </span>
            {dislikedColors.length > 0 && (
              <button
                type="button"
                onClick={() => setDislikedColors([])}
                className="text-caption text-accent underline-offset-4 hover:underline"
              >
                נקה
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => {
              const selected = dislikedColors.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleColor(c.id)}
                  aria-pressed={selected}
                  className={`inline-flex h-10 items-center gap-2 rounded-full border px-3 font-display text-sm font-bold transition-all duration-fast ease-emphasized active:translate-y-0 ${
                    selected
                      ? "border-destructive bg-destructive/15 text-destructive line-through"
                      : "border-border bg-background text-foreground hover:-translate-y-0.5 hover:border-accent/40"
                  }`}
                >
                  <span
                    aria-hidden
                    className="h-4 w-4 rounded-full border border-border/60"
                    style={{ backgroundColor: c.swatch }}
                  />
                  {c.labelHe}
                </button>
              );
            })}
          </div>
        </div>

        {/* Disliked teams */}
        <div className="mt-5">
          <label
            htmlFor="mystery-disliked-teams"
            className="mb-2 block font-display text-overline tracking-[0.18em] text-muted"
          >
            קבוצות שאתם פחות אוהבים
          </label>
          <input
            id="mystery-disliked-teams"
            type="text"
            value={dislikedTeams}
            onChange={(e) => setDislikedTeams(e.target.value)}
            placeholder="למשל: ריאל מדריד, ארסנל"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <p className="mt-1 text-caption text-muted">
            פרידו בפסיקים. נשתדל לא לבחור עבורכם חולצה מהקבוצות האלו.
          </p>
        </div>
      </div>

      {/* ============ Sticky CTA ============ */}
      <div className="sticky bottom-3 z-10 space-y-3 rounded-2xl border border-border bg-surface/95 p-4 shadow-2xl backdrop-blur edge-light">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <span className="font-display text-overline tracking-[0.18em] text-muted">
              סה״כ ({quantity} {quantity === 1 ? "חולצה" : "חולצות"})
            </span>
            <div className="font-display text-h1 font-black text-foreground">
              {formatILS(total)}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              size="lg"
              onClick={() => addToCart(false)}
              disabled={adding}
              className={`animate-pulse-glow transition-all duration-base ease-emphasized ${justAdded ? "bg-accent/80" : ""}`}
            >
              {justAdded ? (
                <>
                  <Check className="h-4 w-4" /> נוסף לסל
                </>
              ) : (
                <>הוספה לסל</>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => addToCart(true)}
              disabled={adding}
            >
              קנייה מיידית
            </Button>
          </div>
        </div>
        {!allConfigured && (
          <p
            role="status"
            aria-live="polite"
            className="text-caption text-amber"
          >
            השלימו קהל + סוג + מידה לכל החולצות לפני הוספה לסל.
          </p>
        )}
      </div>
    </div>
  );
}
