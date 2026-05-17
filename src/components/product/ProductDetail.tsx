"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  Truck,
  Shield,
  MessageCircle,
  Plus,
  Minus,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SizeGuideTable from "@/components/product/SizeGuideTable";
import JerseyDropWatermark from "./JerseyDropWatermark";
import CustomizationForm, {
  initialCustomization,
  type CustomizationState,
} from "./CustomizationForm";
import MysteryBoxControls, {
  initialMystery,
  mysteryNote,
  type MysteryState,
} from "./MysteryBoxControls";
import { useCart } from "@/lib/cart";
import {
  getAvailableVersions,
  getDisplayableSizes,
  getPriceTier,
  hasPrice,
  priceFor,
  TIER_META,
} from "@/lib/products";
import { Sparkles } from "lucide-react";
import { CUSTOMIZATION_FEE, SHIPPING, whatsappLink } from "@/lib/constants";
import { NO_PATCH } from "@/lib/patches";
import { formatILS } from "@/lib/utils";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";
import { descriptionParagraphs } from "@/lib/sanitize";
import type { Product, ProductVersion } from "@/lib/types";

const FALLBACK_IMG =
  "https://picsum.photos/seed/jerseydrop-fallback/800/1000";

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const setOpen = useCart((s) => s.setOpen);

  const availableVersions = getAvailableVersions(product);
  const sizes = getDisplayableSizes(product);
  const productHasPrice = hasPrice(product);
  const images = product.images?.length ? product.images : [FALLBACK_IMG];
  const isMysteryBox = getPriceTier(product) === "mystery";

  const [version, setVersion] = useState<ProductVersion>(
    availableVersions[0] ?? "fan",
  );
  const [size, setSize] = useState<string | null>(null);
  const [imageIdx, setImageIdx] = useState(0);
  const [customization, setCustomization] = useState<CustomizationState>(
    initialCustomization,
  );
  const [mystery, setMystery] = useState<MysteryState>(initialMystery);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const base = priceFor(product, version);
  const total = isMysteryBox
    ? base !== null
      ? base * mystery.quantity
      : null
    : base !== null
      ? base + (customization.nameNumberEnabled ? CUSTOMIZATION_FEE : 0)
      : null;

  const versionLabel: Record<ProductVersion, string> = {
    fan: "Fan",
    player: "Player",
    retro: "Retro",
  };
  const versionDesc: Record<ProductVersion, string> = {
    fan: "בד רגיל, גזרה רגילה",
    player: "בד מיקרו-פייבר נושם, פחות משקל",
    retro: "רפרודוקציה של הדגם המקורי",
  };

  const whatsappMessage = `שלום! אני מתעניין/ת בחולצה: ${product.nameHe}${
    product.season ? ` (${product.season})` : ""
  }. אפשר לבדוק זמינות ומחיר?`;

  const addToCart = (buyNow = false) => {
    if (!productHasPrice || base === null) return;
    // Mystery Box flow: validate the mystery-specific size, encode preferences
    // (type + size) into customerNotes so the team sees what to source.
    if (isMysteryBox) {
      if (!mystery.size) {
        document
          .getElementById("size-group")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      setAdding(true);
      addItem({
        productId: product.id,
        slug: product.slug,
        nameHe: product.nameHe,
        nameEn: product.nameEn,
        team: product.team,
        image: images[0],
        version,
        size: mystery.size as never,
        unitPrice: base,
        customization: null,
        selectedPatchId: null,
        customerNotes: mysteryNote(mystery),
        quantity: mystery.quantity,
      });
      setTimeout(() => {
        setAdding(false);
        if (buyNow) router.push("/checkout");
        else {
          setJustAdded(true);
          setOpen(true);
          setTimeout(() => setJustAdded(false), 1500);
        }
      }, 250);
      return;
    }
    if (sizes.length > 0 && !size) {
      document
        .getElementById("size-group")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setAdding(true);
    const nameNumber =
      customization.nameNumberEnabled &&
      (customization.name || customization.number)
        ? {
            name: customization.name.toUpperCase(),
            number: customization.number,
          }
        : null;
    const patchId =
      customization.selectedPatchId && customization.selectedPatchId !== NO_PATCH.id
        ? customization.selectedPatchId
        : null;
    const notes = customization.customerNotes.trim() || null;
    addItem({
      productId: product.id,
      slug: product.slug,
      nameHe: product.nameHe,
      nameEn: product.nameEn,
      team: product.team,
      image: images[0],
      version,
      size: (size ?? "אחיד") as never,
      unitPrice: base,
      customization: nameNumber,
      selectedPatchId: patchId,
      customerNotes: notes,
    });
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

  const stockBadge = useMemo(() => {
    if (product.stock === "low")
      return { text: "אחרונים במלאי", tone: "destructive" as const };
    if (product.stock === "preorder")
      return { text: "הזמנה מוקדמת", tone: "gold" as const };
    return { text: "במלאי · משלוח 10-17 ימי עסקים", tone: "accent" as const };
  }, [product.stock]);

  return (
    <>
      <section className="container grid gap-8 py-8 md:grid-cols-[1.1fr_1fr] md:py-12">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-surface">
            <Image
              src={images[imageIdx] || FALLBACK_IMG}
              alt={product.nameHe || product.team}
              fill
              priority
              sizes="(min-width: 768px) 55vw, 100vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover"
            />
            <JerseyDropWatermark src={images[imageIdx]} size="md" />
            <div className="absolute top-3 flex flex-col gap-1.5 start-3">
              {product.isWorldCup2026 && (
                <Badge variant="gold">מונדיאל 2026</Badge>
              )}
              {product.isRetro && <Badge variant="gold">Retro</Badge>}
              {product.isKids && <Badge variant="accent">ילדים</Badge>}
              {product.isLongSleeve && (
                <Badge variant="outline">שרוול ארוך</Badge>
              )}
              {product.isSpecial && <Badge variant="accent">מהדורה מיוחדת</Badge>}
            </div>
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  onClick={() => setImageIdx(i)}
                  className={`relative aspect-square overflow-hidden rounded-xl border transition-all ${
                    i === imageIdx
                      ? "border-accent shadow-glow-sm"
                      : "border-border opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`תמונה ${i + 1}`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="100px"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="space-y-1">
            {product.season && (
              <div className="section-eyebrow">{product.season}</div>
            )}
            <h1 className="font-display text-3xl font-black uppercase leading-tight md:text-4xl">
              {product.team || product.nameHe}
            </h1>
            <p className="text-sm text-muted">{product.nameHe}</p>
          </div>

          {/* V7 — pricing tier chip + price headline. The chip mirrors the
               brand tone of the tier (gold for special, accent neon for
               mystery, etc.) so the buyer instantly clocks what kind of
               product they're looking at. */}
          {(() => {
            const tier = getPriceTier(product);
            const meta = TIER_META[tier];
            const toneClass: Record<string, string> = {
              regular: "border-border bg-surface text-foreground",
              accent: "border-accent/60 bg-accent/15 text-accent shadow-glow-sm",
              gold: "border-gold/60 bg-gold/15 text-gold shadow-gold",
              violet: "border-violet/40 bg-violet/15 text-violet",
              amber: "border-amber/40 bg-amber/15 text-amber",
              cyan: "border-cyan/40 bg-cyan/15 text-cyan",
            };
            return (
              <div className="flex items-baseline gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-overline tracking-[0.18em] ${toneClass[meta.tone]}`}
                >
                  {tier === "mystery" && <Sparkles className="h-3 w-3" />}
                  {meta.labelHe}
                </span>
                <span className="font-display text-h1 font-black text-foreground">
                  {formatILS(meta.price)}
                </span>
              </div>
            );
          })()}

          {/* Mystery Box explainer — only shown for the lottery product. */}
          {getPriceTier(product) === "mystery" && (
            <div className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/5 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
              <div className="space-y-1">
                <div className="font-display text-body font-bold text-accent">
                  Mystery Box
                </div>
                <p className="text-body-sm text-muted">
                  חולצת כדורגל אקראית במידה לבחירתך. הקבוצה מפתיעה!
                </p>
              </div>
            </div>
          )}

          <Badge variant={stockBadge.tone}>{stockBadge.text}</Badge>

          {/* Mystery Box controls — replaces version/size/customization for
              the lottery product. Encodes type+size into customerNotes; quantity
              is passed straight to addItem so cart math multiplies correctly. */}
          {isMysteryBox && productHasPrice && (
            <MysteryBoxControls value={mystery} onChange={setMystery} />
          )}

          {/* Version selector — only when prices set & not a Mystery Box */}
          {!isMysteryBox && productHasPrice && availableVersions.length > 0 && (
            <fieldset>
              <legend className="mb-2 font-display text-overline font-bold tracking-[0.18em] text-muted">
                גרסה
              </legend>
              <div
                className={`grid gap-2 ${
                  availableVersions.length === 1
                    ? "grid-cols-1"
                    : availableVersions.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-3"
                }`}
              >
                {availableVersions.map((v) => {
                  const p = priceFor(product, v);
                  if (p === null) return null;
                  const selected = version === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVersion(v)}
                      aria-pressed={selected}
                      className={`flex flex-col items-start gap-0.5 rounded-xl border p-3 text-start transition-all duration-base ease-emphasized active:translate-y-0 ${
                        selected
                          ? "border-accent bg-accent/10 shadow-glow-sm"
                          : "border-border bg-surface hover:-translate-y-0.5 hover:border-accent/40"
                      }`}
                    >
                      <span className="flex w-full items-center justify-between">
                        <span className="font-display text-body-sm font-bold uppercase">
                          {versionLabel[v]}
                        </span>
                        <span className="font-display text-body-sm font-bold text-foreground">
                          {formatILS(p)}
                        </span>
                      </span>
                      <span className="text-caption text-muted">
                        {versionDesc[v]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Size selector — Mystery Box has its own size control above */}
          {!isMysteryBox && sizes.length > 0 ? (
            <fieldset id="size-group">
              <legend className="mb-2 flex items-center justify-between font-display text-overline font-bold tracking-[0.18em] text-muted">
                מידה
                <span className="flex items-center gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-caption text-accent underline-offset-4 transition-colors duration-base hover:underline"
                      >
                        מדריך מידות מהיר
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>מדריך מידות</DialogTitle>
                      </DialogHeader>
                      <SizeGuideTable />
                    </DialogContent>
                  </Dialog>
                  <a
                    href="/size-guide"
                    className="text-caption text-muted underline-offset-4 transition-colors duration-base hover:text-accent hover:underline"
                  >
                    לא בטוחים? מדריך מידות מלא ←
                  </a>
                </span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const selected = size === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
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
          ) : !isMysteryBox ? (
            <div className="rounded-xl border border-border bg-surface px-3 py-2 text-caption text-muted">
              מידה אחידה — בחר/י את הגרסה ולחץ/י על &quot;הוספה לסל&quot;.
            </div>
          ) : null}

          {/* Customization (name+number, patch, notes) — irrelevant for the
              random Mystery Box flow. */}
          {!isMysteryBox && productHasPrice && (
            <CustomizationForm
              product={product}
              value={customization}
              onChange={setCustomization}
            />
          )}

          {/* CTAs */}
          {productHasPrice && total !== null ? (
            <div className="space-y-3 rounded-2xl border border-border/60 bg-surface/40 p-4 edge-light backdrop-blur-sm">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-overline font-bold tracking-[0.18em] text-muted">
                  סה״כ
                </span>
                <span className="font-display text-h1 font-black text-foreground">
                  {formatILS(total)}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1.5fr_1fr]">
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
                    <>הוספה לסל — {formatILS(total)}</>
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
              {((isMysteryBox && !mystery.size) ||
                (!isMysteryBox && sizes.length > 0 && !size)) && (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-caption text-muted"
                >
                  בחרו מידה לפני הוספה לסל.
                </p>
              )}
            </div>
          ) : null}

          {/* Trust row */}
          <div className="grid gap-2 rounded-2xl border border-border bg-surface p-4 text-xs text-muted md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-accent" />
              <span>
                משלוח {SHIPPING.leadTimeDays} ימי עסקים · חינם מעל{" "}
                {formatILS(SHIPPING.freeThreshold)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <span>החלפות תוך 14 יום</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-accent" />
              <span>שירות לקוחות בעברית</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" />
              <span>תשלום מאובטח — אשראי / Bit / Apple Pay</span>
            </div>
          </div>

          {/* Description (sanitized HTML) */}
          {product.description && (
            <details className="group rounded-2xl border border-border bg-surface p-4" open>
              <summary className="cursor-pointer list-none font-display text-sm font-bold uppercase tracking-widest text-foreground">
                <span className="flex items-center justify-between">
                  תיאור וחומרים
                  <Plus className="h-4 w-4 transition-transform group-open:hidden" />
                  <Minus className="hidden h-4 w-4 transition-transform group-open:inline" />
                </span>
              </summary>
              {/* Sanitized via sanitize-html (strict whitelist), then rendered
                  as plain JSX paragraphs — no raw HTML injection. */}
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                {descriptionParagraphs(product.description).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </details>
          )}
        </div>
      </section>

      {/* Mobile sticky CTA — neon-green for primary visibility, safe-area inset */}
      {productHasPrice && total !== null ? (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/95 p-3 shadow-2xl backdrop-blur md:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="font-display text-[10px] uppercase text-white/60">
                סה״כ
              </span>
              <span className="font-display text-base font-bold text-white">
                {formatILS(total)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => addToCart(false)}
              disabled={adding}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#00FF88] px-6 font-display text-base font-bold uppercase tracking-wide text-black shadow-[0_8px_24px_-8px_rgba(0,255,136,0.7)] transition-transform duration-150 active:scale-95 disabled:opacity-60"
            >
              {justAdded ? "נוסף" : "הוספה לסל"}
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/95 p-3 shadow-2xl backdrop-blur md:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <Button asChild size="md" className="w-full">
            <a
              href={whatsappLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              הזמנה — וואטסאפ
            </a>
          </Button>
        </div>
      )}
    </>
  );
}
