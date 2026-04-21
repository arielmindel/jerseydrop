"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Truck, Shield, MessageCircle, Plus, Minus, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import JerseyPreview from "./JerseyPreview";
import SizeGuideTable from "@/components/product/SizeGuideTable";
import { useCart } from "@/lib/cart";
import { priceFor } from "@/lib/products";
import { CUSTOMIZATION_FEE, SHIPPING, type Size } from "@/lib/constants";
import { formatILS } from "@/lib/utils";
import type { Product, ProductVersion } from "@/lib/types";

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const setOpen = useCart((s) => s.setOpen);

  const availableVersions = product.versions;
  const defaultVersion: ProductVersion = availableVersions[0];

  const [version, setVersion] = useState<ProductVersion>(defaultVersion);
  const [size, setSize] = useState<Size | null>(null);
  const [imageIdx, setImageIdx] = useState(0);
  const [custEnabled, setCustEnabled] = useState(false);
  const [custName, setCustName] = useState("");
  const [custNumber, setCustNumber] = useState("");
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const base = priceFor(product, version);
  const total = base + (custEnabled ? CUSTOMIZATION_FEE : 0);

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

  const addToCart = (buyNow = false) => {
    if (!size) {
      document.getElementById("size-group")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setAdding(true);
    const customization =
      custEnabled && (custName || custNumber)
        ? { name: custName.toUpperCase(), number: custNumber }
        : null;
    addItem({
      productId: product.id,
      slug: product.slug,
      nameHe: product.nameHe,
      nameEn: product.nameEn,
      team: product.team,
      image: product.images[0],
      version,
      size,
      unitPrice: base,
      customization,
    });
    setTimeout(() => {
      setAdding(false);
      if (buyNow) {
        router.push("/checkout");
      } else {
        setJustAdded(true);
        setOpen(true);
        setTimeout(() => setJustAdded(false), 1500);
      }
    }, 250);
  };

  const stockBadge = useMemo(() => {
    if (product.stock === "low") return { text: "אחרונים במלאי", tone: "destructive" as const };
    if (product.stock === "preorder") return { text: "הזמנה מוקדמת", tone: "gold" as const };
    return { text: "במלאי · משלוח 10-15 ימי עסקים", tone: "accent" as const };
  }, [product.stock]);

  return (
    <>
      <section className="container grid gap-8 py-8 md:grid-cols-[1.1fr_1fr] md:py-12">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-surface">
            <Image
              src={product.images[imageIdx]}
              alt={`${product.nameEn} — ${product.nameHe}`}
              fill
              priority
              sizes="(min-width: 768px) 55vw, 100vw"
              className="object-cover"
            />
            <div className="absolute top-3 flex flex-col gap-1.5 start-3">
              {product.tags.includes("world-cup-2026") && (
                <Badge variant="accent">World Cup 2026</Badge>
              )}
              {product.tags.includes("bestseller") && (
                <Badge variant="accent">Bestseller</Badge>
              )}
              {product.category === "retro" && <Badge variant="gold">Retro</Badge>}
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((src, i) => (
                <button
                  key={src}
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
            <div className="section-eyebrow">{product.season}</div>
            <h1 className="font-display text-3xl font-black uppercase leading-tight md:text-4xl">
              {product.team}
            </h1>
            <p className="text-sm text-muted">{product.nameHe}</p>
          </div>

          <Badge variant={stockBadge.tone}>{stockBadge.text}</Badge>

          {/* Version selector */}
          <fieldset>
            <legend className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-muted">
              גרסה
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {availableVersions.map((v) => (
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
                      {formatILS(priceFor(product, v))}
                    </span>
                  </span>
                  <span className="text-[11px] text-muted">{versionDesc[v]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Size selector */}
          <fieldset id="size-group">
            <legend className="mb-2 flex items-center justify-between font-display text-xs font-bold uppercase tracking-widest text-muted">
              מידה
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-[10px] text-accent underline-offset-2 hover:underline"
                  >
                    מדריך מידות
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>מדריך מידות</DialogTitle>
                  </DialogHeader>
                  <SizeGuideTable />
                </DialogContent>
              </Dialog>
            </legend>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
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

          {/* Customization */}
          {product.customizable && (
            <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={custEnabled}
                  onChange={(e) => setCustEnabled(e.target.checked)}
                  className="mt-1 h-5 w-5 accent-[#00FF88]"
                />
                <span className="space-y-0.5">
                  <span className="block font-display text-sm font-bold uppercase tracking-tight">
                    הוספת שם ומספר{" "}
                    <span className="text-accent">+{formatILS(CUSTOMIZATION_FEE)}</span>
                  </span>
                  <span className="block text-xs text-muted">
                    הדפסה מקצועית בגב החולצה. עד 12 אותיות באנגלית + מספר 0-99.
                  </span>
                </span>
              </label>
              {custEnabled && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid gap-4 md:grid-cols-[1.2fr_1fr]"
                >
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cust-name">שם (A-Z, מספרים)</Label>
                      <Input
                        id="cust-name"
                        value={custName}
                        onChange={(e) =>
                          setCustName(
                            e.target.value.replace(/[^A-Za-z0-9 ]/g, "").toUpperCase(),
                          )
                        }
                        maxLength={12}
                        placeholder="MESSI"
                      />
                      <div className="text-[10px] text-muted">{custName.length}/12</div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cust-number">מספר</Label>
                      <Input
                        id="cust-number"
                        value={custNumber}
                        onChange={(e) =>
                          setCustNumber(e.target.value.replace(/\D/g, "").slice(0, 2))
                        }
                        inputMode="numeric"
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="relative aspect-square rounded-2xl border border-border bg-background p-2">
                    <JerseyPreview name={custName} number={custNumber} />
                    <span className="absolute bottom-2 end-2 rounded-full bg-background/80 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-widest text-accent">
                      תצוגה חיה
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* CTAs */}
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
                  <>
                    הוספה לסל — {formatILS(total)}
                  </>
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
            {!size && (
              <p className="text-[11px] text-muted">
                בחרו מידה לפני הוספה לסל.
              </p>
            )}
          </div>

          {/* Trust row */}
          <div className="grid gap-2 rounded-2xl border border-border bg-surface p-4 text-xs text-muted md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-accent" />
              <span>
                משלוח {SHIPPING.leadTimeDays} ימי עסקים · חינם מעל {formatILS(SHIPPING.freeThreshold)}
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

          {/* Description */}
          <details className="group rounded-2xl border border-border bg-surface p-4">
            <summary className="cursor-pointer list-none font-display text-sm font-bold uppercase tracking-widest text-foreground">
              <span className="flex items-center justify-between">
                תיאור וחומרים
                <Plus className="h-4 w-4 transition-transform group-open:hidden" />
                <Minus className="hidden h-4 w-4 transition-transform group-open:inline" />
              </span>
            </summary>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
              <p>
                חולצת {product.nameHe}, עונת {product.season}. גזרה נאמנה
                למקור, פוליאסטר נושם בגרסת Fan ומיקרו-פייבר בגרסת Player.
              </p>
              <p>
                כביסה: מקס׳ 30°, ללא מייבש חשמלי, ללא אקונומיקה. גיהוץ על הצד
                ההפוך בטמפרטורה נמוכה.
              </p>
              <p>
                הערה: חולצות עם שם ומספר מותאם אישית אינן ניתנות להחזרה.
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 shadow-2xl backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-display text-[10px] uppercase text-muted">סה״כ</span>
            <span className="font-display text-base font-bold">{formatILS(total)}</span>
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
    </>
  );
}
