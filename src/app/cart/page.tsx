"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, computeTotals, lineTotal } from "@/lib/cart";
import CartItemDetails from "@/components/cart/CartItemDetails";
import { SHIPPING } from "@/lib/constants";
import { formatILS } from "@/lib/utils";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const { subtotal, count, shipping, total } = computeTotals(items);

  const versionLabel: Record<string, string> = {
    fan: "Fan",
    player: "Player",
    retro: "Retro",
  };

  if (!mounted) {
    return (
      <div className="container py-20 text-center text-muted">טוען את הסל…</div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface">
          <ShoppingBag className="h-8 w-8 text-muted" />
        </div>
        <h1 className="font-display text-3xl font-black uppercase">הסל ריק</h1>
        <p className="max-w-sm text-sm text-muted">
          אין לכם פריטים בסל. כנסו לקולקציה ותמצאו את החולצה שלכם.
        </p>
        <Button asChild>
          <Link href="/products">לקולקציה ←</Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="container grid gap-8 py-10 md:grid-cols-[1.3fr_1fr] md:py-14">
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-black uppercase md:text-4xl">
          הסל שלך · <span className="text-accent">{count} פריטים</span>
        </h1>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 p-4">
              <Link
                href={`/products/${item.slug}`}
                className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-background"
              >
                <Image src={item.image} alt={item.nameEn} fill sizes="100px" className="object-cover" />
              </Link>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-display text-base font-bold uppercase hover:text-accent"
                  >
                    {item.team}
                  </Link>
                  <span className="font-display text-sm font-bold text-foreground">
                    {formatILS(lineTotal(item))}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  <span>{item.nameHe}</span>
                  <span>·</span>
                  <span>{versionLabel[item.version]}</span>
                  <span>·</span>
                  <span>מידה {item.size}</span>
                </div>
                <CartItemDetails item={item} />
                {item.customerNotes && (
                  <div
                    className="rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] leading-relaxed text-muted"
                    title={item.customerNotes}
                  >
                    📝 <span className="font-semibold text-foreground">הערות:</span>{" "}
                    {item.customerNotes}
                  </div>
                )}
                <div className="mt-auto flex items-center gap-3">
                  <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background">
                    <button
                      type="button"
                      aria-label="הפחת"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center font-display text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="הוסף"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="inline-flex items-center gap-1 text-xs text-muted hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> הסר
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Button asChild variant="ghost" size="sm">
          <Link href="/products">← המשך בקניות</Link>
        </Button>
      </div>

      <aside className="self-start space-y-4 rounded-2xl border border-border bg-surface p-5 md:sticky md:top-24">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          סיכום הזמנה
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted">
            <dt>סיכום ביניים</dt>
            <dd className="font-display font-bold text-foreground">
              {formatILS(subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between text-muted">
            <dt>משלוח</dt>
            <dd className="font-display font-bold text-foreground">
              {shipping === 0 ? "חינם" : formatILS(shipping)}
            </dd>
          </div>
          {subtotal < SHIPPING.freeThreshold && (
            <div className="rounded-lg bg-accent/10 p-2 text-[11px] text-accent">
              עוד {formatILS(SHIPPING.freeThreshold - subtotal)} ותקבלו משלוח חינם.
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
            <dt className="font-display text-xs uppercase tracking-widest text-muted">
              סה״כ
            </dt>
            <dd className="font-display text-xl font-black text-accent">
              {formatILS(total)}
            </dd>
          </div>
        </dl>
        <Button asChild size="lg" className="w-full">
          <Link href="/checkout">לתשלום ←</Link>
        </Button>
        <p className="text-[11px] text-muted">
          משלוח 10–15 ימי עסקים · החלפות תוך 14 יום · תשלום מאובטח.
        </p>
      </aside>
    </section>
  );
}
