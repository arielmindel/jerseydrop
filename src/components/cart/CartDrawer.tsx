"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SHIPPING } from "@/lib/constants";
import { formatILS } from "@/lib/utils";
import { useCart, computeTotals, lineTotal } from "@/lib/cart";
import CartItemDetails from "./CartItemDetails";

export default function CartDrawer() {
  // Hydration-safety: Zustand-persist reads from localStorage on the client,
  // but on the server `items` is always []. If we render `count > 0` before
  // mount, the server HTML and the first client render disagree → React
  // hydration error #418/#423/#425, which throws away the entire DOM tree
  // and re-renders. That re-render breaks Next/Image's lazy loading and
  // leaves product images blank across the whole site.
  //
  // Fix: render with the empty-cart state until `mounted` flips true on the
  // client. After mount we use the real persisted store. The server HTML
  // and the first client render stay byte-identical.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const storeItems = useCart((s) => s.items);
  const isOpen = useCart((s) => s.isOpen);
  const setOpen = useCart((s) => s.setOpen);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);

  const items = mounted ? storeItems : [];
  const { subtotal, count, shipping, total } = computeTotals(items);

  const versionLabel: Record<string, string> = {
    fan: "Fan",
    player: "Player",
    retro: "Retro",
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`עגלת קניות${count > 0 ? ` — ${count} פריטים` : ""}`}
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-all duration-base hover:bg-surface hover:text-foreground"
        >
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -end-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-display text-[0.625rem] font-bold text-accent-foreground shadow-glow-sm">
              {count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="responsive-cart" className="flex flex-col p-0 pb-[env(safe-area-inset-bottom)] md:pb-0">
        <SheetHeader>
          <SheetTitle>הסל שלך · {count} פריטים</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          // Empty state — friendly icon + clear next step.
          <div className="flex flex-1 items-center justify-center px-6 py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent shadow-glow-sm">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <p className="font-display text-h2 font-bold uppercase tracking-tight">
                הסל ריק
              </p>
              <p className="max-w-xs text-body-sm text-muted">
                זה הזמן לבחור את החולצה הבאה שלך.
              </p>
              <Button
                asChild
                size="md"
                variant="primary"
                className="mt-3"
                onClick={() => setOpen(false)}
              >
                <Link href="/#leagues">לקטלוג הליגות ←</Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-border overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 p-4">
                <Link
                  href={`/products/${item.slug}`}
                  onClick={() => setOpen(false)}
                  className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-background"
                >
                  <Image src={item.image} alt={item.nameEn} fill sizes="80px" className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className="line-clamp-1 font-display text-sm font-bold uppercase hover:text-accent"
                  >
                    {item.team}
                  </Link>
                  <div className="flex flex-wrap gap-1 text-[11px] text-muted">
                    <span>{versionLabel[item.version]}</span>
                    <span>·</span>
                    <span>מידה {item.size}</span>
                  </div>
                  <CartItemDetails item={item} />
                  {item.customerNotes && (
                    <div
                      className="line-clamp-2 text-[11px] text-muted"
                      title={item.customerNotes}
                    >
                      📝{" "}
                      {item.customerNotes.length > 30
                        ? item.customerNotes.slice(0, 30) + "…"
                        : item.customerNotes}
                    </div>
                  )}
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background">
                      <button
                        type="button"
                        aria-label="הפחת"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center text-muted hover:text-foreground"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center font-display text-xs font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="הוסף"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center text-muted hover:text-foreground"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-display text-sm font-bold">
                      {formatILS(lineTotal(item))}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label="הסר מהסל"
                  className="self-start rounded-full p-1.5 text-muted hover:bg-background hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <SheetFooter>
          <div className="space-y-1 text-body-sm">
            <div className="flex items-center justify-between text-muted">
              <span>סיכום ביניים</span>
              <span className="font-display font-bold text-foreground">
                {formatILS(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>משלוח</span>
              <span className="font-display font-bold text-foreground">
                {shipping === 0 ? "חינם" : formatILS(shipping)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
              <span className="font-display text-overline font-bold tracking-[0.18em] text-muted">
                סה״כ
              </span>
              <span className="font-display text-h2 font-black text-accent">
                {formatILS(total)}
              </span>
            </div>
          </div>
          {subtotal > 0 && subtotal < SHIPPING.freeThreshold && (
            // Progress towards free-shipping threshold. Fills the bar so the
            // customer sees how close they are without having to do the math.
            <div
              role="status"
              aria-live="polite"
              className="space-y-1.5 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2 text-caption">
                <span className="text-accent">
                  עוד{" "}
                  <strong className="font-display">
                    {formatILS(SHIPPING.freeThreshold - subtotal)}
                  </strong>{" "}
                  למשלוח חינם!
                </span>
                <span className="text-muted">
                  {formatILS(subtotal)} / {formatILS(SHIPPING.freeThreshold)}
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-accent/10"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-accent transition-all duration-base ease-emphasized"
                  style={{
                    width: `${Math.min(
                      100,
                      (subtotal / SHIPPING.freeThreshold) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
          {subtotal >= SHIPPING.freeThreshold && (
            <p
              role="status"
              aria-live="polite"
              className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-center font-display text-caption font-bold uppercase tracking-[0.18em] text-accent"
            >
              משלוח חינם 🎉
            </p>
          )}
          <Button
            asChild
            variant="primary"
            size="lg"
            disabled={items.length === 0}
            className="w-full"
          >
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              aria-disabled={items.length === 0}
            >
              לקופה ←
            </Link>
          </Button>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-center text-caption text-muted transition-colors duration-base hover:text-foreground"
            >
              המשך בקניות
            </button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
