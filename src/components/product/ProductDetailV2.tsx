"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trackAddToCart, trackViewItem } from "@/lib/gtag";
import {
  Check,
  ChevronDown,
  CreditCard,
  RotateCw,
  Shield,
  Sparkles,
  Trophy,
  Truck,
  Baby,
  Crown,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import ProductGalleryV2 from "./ProductGalleryV2";
import { useCart } from "@/lib/cart";
import { getAvailablePatches, NO_PATCH } from "@/lib/patches";
import {
  getCompareAtPrice,
  getDisplayableSizes,
  getPriceTier,
  TIER_META,
} from "@/lib/products";
import { CUSTOMIZATION_FEE, SHIPPING } from "@/lib/constants";
import { formatILS } from "@/lib/utils";
import { descriptionParagraphs } from "@/lib/sanitize";
import type { Product } from "@/lib/types";

const FALLBACK_IMG =
  "https://picsum.photos/seed/jerseydrop-fallback/800/1000";

export default function ProductDetailV2({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const setOpen = useCart((s) => s.setOpen);

  const tier = getPriceTier(product);
  const tierMeta = TIER_META[tier];
  const basePrice = tierMeta.price;
  const sizes = getDisplayableSizes(product);
  const patches = getAvailablePatches(product);
  const images = product.images?.length ? product.images : [FALLBACK_IMG];
  const altText = product.nameHe || product.nameEn || product.team;

  const [size, setSize] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [enableCustom, setEnableCustom] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [patchId, setPatchId] = useState<string>(NO_PATCH.id);
  const [descOpen, setDescOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const totalPrice = useMemo(
    () => basePrice + (enableCustom ? CUSTOMIZATION_FEE : 0),
    [basePrice, enableCustom],
  );

  const descParagraphs = descriptionParagraphs(product.description);
  const longDescription = descParagraphs.join(" ").length > 280;

  // GA4 view_item — fires once when the product detail mounts
  useEffect(() => {
    trackViewItem({
      slug: product.slug,
      nameHe: product.nameHe,
      category: product.category,
      team: product.team,
      price: basePrice,
    });
  }, [product.slug, product.nameHe, product.category, product.team, basePrice]);

  const addToCart = (buyNow = false) => {
    if (!size) {
      toast.error("יש לבחור מידה לפני הוספה לסל");
      document
        .getElementById("size-selector")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setAdding(true);
    const cust =
      enableCustom && (name || number)
        ? { name: name.toUpperCase(), number }
        : null;
    const selectedPatchId =
      enableCustom && patchId !== NO_PATCH.id ? patchId : null;
    addItem({
      productId: product.id,
      slug: product.slug,
      nameHe: product.nameHe,
      nameEn: product.nameEn,
      team: product.team,
      image: images[0],
      version: "fan",
      size: size as never,
      unitPrice: basePrice,
      customization: cust,
      selectedPatchId,
      customerNotes: null,
    });
    // GA4 add_to_cart
    trackAddToCart(
      {
        slug: product.slug,
        nameHe: product.nameHe,
        category: product.category,
        team: product.team,
        price: totalPrice,
      },
      1,
    );
    toast.success("נוסף לסל!", {
      description: `${product.team || product.nameHe} · מידה ${size}${cust ? ` · ${cust.name} #${cust.number}` : ""}`,
    });
    setTimeout(() => {
      setAdding(false);
      if (buyNow) router.push("/checkout");
      else setOpen(true);
    }, 300);
  };

  // Tag chips above the title — show only the relevant ones
  const flagBadges = [
    product.isWorldCup2026 && {
      Icon: Trophy,
      label: "מונדיאל 2026",
      tone: "bg-gold/20 text-gold border-gold/30",
    },
    product.isRetro && {
      Icon: Star,
      label: "רטרו",
      tone: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    product.isKids && {
      Icon: Baby,
      label: "ילדים",
      tone: "bg-pink-400/20 text-pink-300 border-pink-400/30",
    },
    product.isSpecial && {
      Icon: Sparkles,
      label: "מהדורה מיוחדת",
      tone: "bg-violet-400/20 text-violet-300 border-violet-400/30",
    },
    product.isLongSleeve && {
      Icon: Crown,
      label: "שרוול ארוך",
      tone: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
    },
  ].filter(Boolean) as Array<{ Icon: typeof Trophy; label: string; tone: string }>;

  return (
    <>
      <section className="container py-6 md:py-10">
        <div className="grid gap-8 md:grid-cols-[55fr_45fr] md:gap-10 md:items-start">
          {/* ===== LEFT — Sticky gallery on desktop ===== */}
          <div className="md:sticky md:top-24">
            <ProductGalleryV2 images={images} alt={altText} />
          </div>

          {/* ===== RIGHT — Info + customization + CTA ===== */}
          <div className="flex flex-col gap-6">
            {/* Header: badges + title + season */}
            <div>
              {flagBadges.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {flagBadges.map((b, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${b.tone}`}
                    >
                      <b.Icon className="h-3 w-3" />
                      {b.label}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="font-display text-2xl font-bold leading-tight md:text-4xl">
                {product.nameHe}
              </h1>
              <p className="mt-2 text-sm text-muted md:text-base">
                {product.team}
                {product.season ? ` · עונת ${product.season}` : ""}
              </p>
            </div>

            {/* Price — strikethrough compare-at anchor above the real price.
                Compare-at is a computed ~+40% rounded-to-X9 anchor (display
                only, never charged). Render only when it's actually higher
                than the real price. RTL: logical utilities (me-*) only. */}
            <div className="flex flex-col gap-1">
              {totalPrice > 0 && getCompareAtPrice(totalPrice) > totalPrice && (
                <span
                  className="font-display text-lg font-bold text-muted line-through decoration-red-500 decoration-2 md:text-2xl"
                  aria-label={`מחיר מקורי: ${formatILS(getCompareAtPrice(totalPrice))}`}
                >
                  {formatILS(getCompareAtPrice(totalPrice))}
                </span>
              )}
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl font-black md:text-5xl">
                  {formatILS(totalPrice)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-muted">
                  {tierMeta.labelHe}
                </span>
              </div>
            </div>

            {/* Size selector */}
            {sizes.length > 0 && (
              <div id="size-selector">
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                    מידה
                  </h3>
                  <a
                    href="/size-guide"
                    className="text-xs text-[#00FF88] underline-offset-4 hover:underline"
                  >
                    מדריך מידות
                  </a>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const selected = size === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        aria-pressed={selected}
                        className={`inline-flex h-12 min-w-[56px] items-center justify-center rounded-full border-2 px-4 font-display text-base font-bold transition-all duration-150 ${
                          selected
                            ? "border-[#00FF88] bg-[#00FF88] text-black shadow-[0_0_18px_rgba(0,255,136,0.35)]"
                            : "border-white/20 bg-white/5 text-foreground hover:border-white/40"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============ CUSTOMIZATION (collapsible mobile / open desktop) ============ */}
            <div className="rounded-2xl border border-[#00FF88]/30 bg-[#00FF88]/5 p-5">
              <button
                type="button"
                onClick={() => setCustomOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 md:cursor-default md:pointer-events-none"
              >
                <div className="flex items-start gap-2.5 text-start">
                  <Sparkles className="h-5 w-5 flex-shrink-0 text-[#00FF88]" />
                  <div>
                    <h3 className="font-display text-lg font-bold leading-tight">
                      התאמה אישית — חינם
                    </h3>
                    <p className="mt-0.5 text-xs text-muted md:text-sm">
                      שם, מספר ופאצ׳ים — בלי תוספת תשלום
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 text-muted transition-transform duration-200 md:hidden ${
                    customOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`${
                  customOpen ? "mt-5 block" : "hidden"
                } md:mt-5 md:block`}
              >
                {/* Toggle */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                  <input
                    type="checkbox"
                    checked={enableCustom}
                    onChange={(e) => setEnableCustom(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    className={`relative inline-block h-6 w-11 flex-shrink-0 rounded-full border transition-colors duration-150 ${
                      enableCustom
                        ? "border-[#00FF88] bg-[#00FF88]/20"
                        : "border-white/20 bg-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 inline-block h-5 w-5 rounded-full bg-white transition-all duration-200 ${
                        enableCustom ? "start-[1.5rem] bg-[#00FF88]" : "start-0.5"
                      }`}
                    />
                  </span>
                  <span className="text-base font-semibold">
                    אני רוצה להתאים אישית
                  </span>
                </label>

                {enableCustom && (
                  <div className="mt-4 space-y-4">
                    {/* Name + Number inputs */}
                    <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                      <input
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        maxLength={12}
                        placeholder="שם (עד 12 תווים, באנגלית)"
                        value={name}
                        onChange={(e) =>
                          setName(
                            e.target.value
                              .replace(/[^A-Za-z\s\-]/g, "")
                              .toUpperCase(),
                          )
                        }
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-[#00FF88] focus:outline-none"
                      />
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        maxLength={2}
                        placeholder="מס׳ 1-99"
                        value={number}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                          if (v === "" || (Number(v) >= 0 && Number(v) <= 99)) {
                            setNumber(v);
                          }
                        }}
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-[#00FF88] focus:outline-none"
                      />
                    </div>

                    {/* Live preview — jersey back simulation */}
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-b from-slate-800 via-slate-900 to-black">
                      {images[1] && (
                        <Image
                          src={images[1]}
                          alt=""
                          fill
                          sizes="(min-width: 768px) 400px, 100vw"
                          className="object-cover opacity-30"
                        />
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="font-display text-3xl font-bold uppercase tracking-[0.18em] text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] md:text-5xl">
                          {name || "YOUR NAME"}
                        </span>
                        <span className="mt-2 font-display text-7xl font-black tabular-nums text-white drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)] md:text-9xl">
                          {number || "10"}
                        </span>
                      </div>
                      <div className="pointer-events-none absolute bottom-3 inset-x-0 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#00FF88] backdrop-blur-md">
                          <Sparkles className="h-3 w-3" />
                          תצוגה חיה
                        </span>
                      </div>
                    </div>

                    {/* Patches */}
                    <div>
                      <h4 className="mb-1 font-display text-sm font-bold uppercase tracking-wider">
                        פאצ׳
                      </h4>
                      <p className="mb-3 text-xs text-muted">
                        בחר פאצ׳ שיוטמע על השרוול (חינם)
                      </p>
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                        {patches.map((p) => {
                          const selected = patchId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setPatchId(p.id)}
                              aria-pressed={selected}
                              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 transition-all duration-150 ${
                                selected
                                  ? "border-[#00FF88] bg-[#00FF88]/10 shadow-[0_0_18px_rgba(0,255,136,0.25)]"
                                  : "border-white/10 bg-black/20 hover:border-white/30"
                              }`}
                            >
                              <div className="relative h-12 w-12">
                                <Image
                                  src={p.iconUrl}
                                  alt={p.nameHe}
                                  fill
                                  sizes="48px"
                                  className="object-contain"
                                />
                              </div>
                              <span className="text-center text-[11px] font-semibold leading-tight text-foreground">
                                {p.nameHe}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ============ DESKTOP "ADD TO CART" — inline ============ */}
            <button
              type="button"
              onClick={() => addToCart(false)}
              disabled={adding}
              className="hidden w-full items-center justify-center gap-2 rounded-full bg-[#00FF88] py-5 font-display text-xl font-bold uppercase tracking-wide text-black shadow-[0_0_30px_rgba(0,255,136,0.45)] transition-transform duration-150 active:scale-95 disabled:opacity-60 md:inline-flex md:hover:scale-[1.02]"
            >
              {adding ? <Check className="h-5 w-5" /> : "הוסף לסל"}
              <span>· {formatILS(totalPrice)}</span>
            </button>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                {
                  Icon: Truck,
                  title: "משלוח 10-17 ימים",
                  sub: "ישר מהיצרן",
                },
                {
                  Icon: Shield,
                  title: "איכות מקורית",
                  sub: "100% אותנטי",
                },
                {
                  Icon: RotateCw,
                  title: "14 יום החזרה",
                  sub: "ללא שאלות",
                },
                {
                  Icon: CreditCard,
                  title: "תשלום מאובטח",
                  sub: "אשראי · Bit · Apple/Google Pay",
                },
              ].map((t) => (
                <div
                  key={t.title}
                  className="flex flex-col items-start gap-1.5 rounded-xl border border-white/5 bg-white/5 p-3"
                >
                  <t.Icon className="h-5 w-5 text-[#00FF88]" />
                  <span className="font-display text-sm font-bold leading-tight">
                    {t.title}
                  </span>
                  <span className="text-xs text-muted">{t.sub}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <section>
              <h2 className="mb-3 font-display text-xl font-bold">
                פרטי המוצר
              </h2>
              <div
                className={`text-sm leading-relaxed text-foreground/85 md:text-base ${
                  !descOpen && longDescription
                    ? "line-clamp-3"
                    : ""
                }`}
              >
                {descParagraphs.length > 0 ? (
                  descParagraphs.map((p, i) => (
                    <p key={i} className={i > 0 ? "mt-2" : ""}>
                      {p}
                    </p>
                  ))
                ) : (
                  <ul className="space-y-1.5">
                    <li>
                      חולצה רשמית של {product.team}
                      {product.season ? `, עונת ${product.season}` : ""}
                    </li>
                    <li>חומר: 100% פוליאסטר נושם, איכות מקורית</li>
                    <li>גזרה: סטנדרטית — לא הדוקה ולא רחבה מדי</li>
                    <li>
                      ייצור על פי הזמנה — משלוח {SHIPPING.leadTimeDays} ימי עסקים
                    </li>
                  </ul>
                )}
              </div>
              {longDescription && (
                <button
                  type="button"
                  onClick={() => setDescOpen((v) => !v)}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#00FF88] hover:underline"
                >
                  {descOpen ? "קרא פחות" : "קרא עוד"}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      descOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </section>
          </div>
        </div>
      </section>

      {/* ===== MOBILE STICKY CTA ===== */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/95 p-3 backdrop-blur-md md:hidden"
        style={{
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        }}
      >
        <button
          type="button"
          onClick={() => addToCart(false)}
          disabled={adding}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#00FF88] font-display text-lg font-bold uppercase tracking-wide text-black shadow-[0_8px_28px_-6px_rgba(0,255,136,0.6)] transition-transform duration-150 active:scale-95 disabled:opacity-60"
        >
          {adding ? <Check className="h-5 w-5" /> : "הוסף לסל"}
          <span>· {formatILS(totalPrice)}</span>
        </button>
      </div>
    </>
  );
}
