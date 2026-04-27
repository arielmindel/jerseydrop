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
import CustomizationForm, {
  initialCustomization,
  type CustomizationState,
} from "./CustomizationForm";
import { useCart } from "@/lib/cart";
import {
  getAvailableVersions,
  getDisplayableSizes,
  hasPrice,
  priceFor,
} from "@/lib/products";
import {
  CUSTOMIZATION_FEE,
  SHIPPING,
  whatsappLink,
} from "@/lib/constants";
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

  const [version, setVersion] = useState<ProductVersion>(
    availableVersions[0] ?? "fan",
  );
  const [size, setSize] = useState<string | null>(null);
  const [imageIdx, setImageIdx] = useState(0);
  const [customization, setCustomization] = useState<CustomizationState>(
    initialCustomization,
  );
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const base = priceFor(product, version);
  const total =
    base !== null
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
    return { text: "במלאי · משלוח 10-15 ימי עסקים", tone: "accent" as const };
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

          <Badge variant={stockBadge.tone}>{stockBadge.text}</Badge>

          {/* Version selector — only when prices set */}
          {productHasPrice && availableVersions.length > 0 && (
            <fieldset>
              <legend className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-muted">
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
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVersion(v)}
                      className={`flex flex-col items-start gap-0.5 rounded-xl border p-3 text-start transition-colors ${
                        version === v
                          ? "border-accent bg-accent/10"
                          : "border-border bg-surface hover:border-accent/40"
                      }`}
                    >
                      <span className="flex w-full items-center justify-between">
                        <span className="font-display text-sm font-bold uppercase">
                          {versionLabel[v]}
                        </span>
                        <span className="font-display text-sm font-bold text-foreground">
                          {formatILS(p)}
                        </span>
                      </span>
                      <span className="text-[11px] text-muted">
                        {versionDesc[v]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Size selector */}
          {sizes.length > 0 ? (
            <fieldset id="size-group">
              <legend className="mb-2 flex items-center justify-between font-display text-xs font-bold uppercase tracking-widest text-muted">
                מידה
                <span className="flex items-center gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-[10px] text-accent underline-offset-2 hover:underline"
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
                    className="text-[10px] text-muted underline-offset-2 hover:text-accent hover:underline"
                  >
                    לא בטוחים? מדריך מידות מלא ←
                  </a>
                </span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`font-display h-10 min-w-[48px] rounded-full border px-4 text-sm font-bold transition-colors ${
                      size === s
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border bg-surface text-foreground hover:border-accent/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
            <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted">
              מידה אחידה — בחר/י את הגרסה ולחץ/י על &quot;הוספה לסל&quot;.
            </div>
          )}

          {/* Customization (name+number, patch, notes) */}
          {productHasPrice && (
            <CustomizationForm
              product={product}
              value={customization}
              onChange={setCustomization}
            />
          )}

          {/* CTAs */}
          {productHasPrice && total !== null ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-xs uppercase tracking-widest text-muted">
                  סה״כ
                </span>
                <span className="font-display text-2xl font-black text-foreground">
                  {formatILS(total)}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1.5fr_1fr]">
                <Button
                  size="lg"
                  onClick={() => addToCart(false)}
                  disabled={adding}
                  className={`animate-pulse-glow ${justAdded ? "bg-accent/80" : ""}`}
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
              {sizes.length > 0 && !size && (
                <p className="text-[11px] text-muted">
                  בחרו מידה לפני הוספה לסל.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-xs uppercase tracking-widest text-muted">
                  מחיר
                </span>
                <span className="font-display text-lg font-bold text-foreground">
                  בקרוב
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted">
                המחיר עוד לא נקבע. שלח/י הודעה בוואטסאפ ונחזיר תשובה מיידית
                עם מחיר וזמינות.
              </p>
              <Button asChild size="lg" className="w-full">
                <a
                  href={whatsappLink(whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  הזמנה — צור קשר בוואטסאפ
                </a>
              </Button>
            </div>
          )}

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
              <span>תשלום מאובטח — אשראי / PayPal / Bit</span>
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

      {/* Mobile sticky CTA */}
      {productHasPrice && total !== null ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 shadow-2xl backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="font-display text-[10px] uppercase text-muted">
                סה״כ
              </span>
              <span className="font-display text-base font-bold">
                {formatILS(total)}
              </span>
            </div>
            <Button
              size="md"
              className="flex-1"
              onClick={() => addToCart(false)}
              disabled={adding}
            >
              {justAdded ? "נוסף" : "הוספה לסל"} <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 shadow-2xl backdrop-blur md:hidden">
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
