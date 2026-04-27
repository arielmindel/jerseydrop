"use client";

import { useEffect } from "react";
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
  const items = useCart((s) => s.items);
  const isOpen = useCart((s) => s.isOpen);
  const setOpen = useCart((s) => s.setOpen);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);

  const { subtotal, count, shipping, total } = computeTotals(items);

  // Hydration-safe count for trigger badge
  useEffect(() => {
    // noop — mount sync
  }, []);

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
          aria-label="עגלת קניות"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -end-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-display text-[10px] font-bold text-accent-foreground">
              {count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0">
        <SheetHeader>
          <SheetTitle>הסל שלך · {count} פריטים</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6 py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background">
                <ShoppingBag className="h-7 w-7 text-muted" />
              </div>
              <p className="font-display text-lg font-bold uppercase tracking-tight">
                הסל ריק
              </p>
              <p className="text-sm text-muted">
                זה הזמן לבחור את החולצה הבאה שלך.
              </p>
              <Button
                asChild
                size="md"
                variant="primary"
                className="mt-3"
                onClick={() => setOpen(false)}
              >
                <Link href="/products">לגלות חולצות ←</Link>
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
          <div className="space-y-1 text-sm">
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
              <span className="font-display text-xs uppercase tracking-widest text-muted">
                סה״כ
              </span>
              <span className="font-display text-lg font-black text-accent">
                {formatILS(total)}
              </span>
            </div>
          </div>
          {subtotal > 0 && subtotal < SHIPPING.freeThreshold && (
            <p className="text-xs text-muted">
              עוד {formatILS(SHIPPING.freeThreshold - subtotal)} למשלוח חינם.
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
              className="text-center text-xs text-muted hover:text-foreground"
            >
              המשך בקניות
            </button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
