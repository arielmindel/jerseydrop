"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart, computeTotals, lineTotal } from "@/lib/cart";
import { SHIPPING } from "@/lib/constants";
import { formatILS } from "@/lib/utils";

type PaymentMethod = "card" | "paypal" | "bit";

export default function CheckoutForm() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const { subtotal, count, shipping, total } = computeTotals(items);

  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promo, setPromo] = useState("");

  const versionLabel: Record<string, string> = {
    fan: "Fan",
    player: "Player",
    retro: "Retro",
  };

  if (!mounted) {
    return <div className="container py-20 text-center text-muted">טוען…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="font-display text-3xl font-black uppercase">הסל ריק</h1>
        <p className="text-sm text-muted">
          צריך להוסיף לפחות חולצה אחת לפני שעוברים לקופה.
        </p>
        <Button asChild>
          <Link href="/products">לקולקציה ←</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          payment,
          items,
          totals: { subtotal, shipping, total },
        }),
      });
      if (!res.ok) throw new Error("order-failed");
      const data = (await res.json()) as { orderNumber: string };
      clear();
      router.push(`/checkout/success?order=${encodeURIComponent(data.orderNumber)}`);
    } catch (err) {
      console.error(err);
      setError("משהו השתבש. נסו שוב בעוד רגע.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="container grid gap-8 py-10 md:grid-cols-[1.2fr_1fr] md:py-14">
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-black uppercase md:text-4xl">
          קופה
        </h1>

        {/* Contact */}
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted">
            פרטי קונה
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">שם מלא</Label>
              <Input id="fullName" name="fullName" required autoComplete="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="050-0000000"
              />
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted">
            כתובת למשלוח
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="city">עיר</Label>
              <Input id="city" name="city" required autoComplete="address-level2" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="street">רחוב</Label>
              <Input id="street" name="street" required autoComplete="address-line1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="building">מס׳ בית</Label>
              <Input id="building" name="building" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apartment">דירה / כניסה (אופציונלי)</Label>
              <Input id="apartment" name="apartment" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">מיקוד</Label>
              <Input id="postalCode" name="postalCode" autoComplete="postal-code" />
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted">
            אמצעי תשלום
          </h2>
          <div className="grid gap-2 md:grid-cols-3">
            {(
              [
                { key: "card", label: "כרטיס אשראי", hint: "ויזה / מאסטרקארד / דיינרס" },
                { key: "paypal", label: "PayPal", hint: "חשבון PayPal" },
                { key: "bit", label: "Bit", hint: "תשלום מהיר מהנייד" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPayment(opt.key)}
                className={`flex flex-col items-start gap-0.5 rounded-xl border p-3 text-start transition-colors ${
                  payment === opt.key
                    ? "border-accent bg-accent/10"
                    : "border-border bg-background hover:border-accent/40"
                }`}
              >
                <span className="flex items-center gap-2 font-display text-sm font-bold uppercase">
                  <CreditCard className="h-4 w-4" />
                  {opt.label}
                </span>
                <span className="text-[11px] text-muted">{opt.hint}</span>
              </button>
            ))}
          </div>

          {payment === "card" && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="cardHolder">שם בעל הכרטיס</Label>
                <Input id="cardHolder" name="cardHolder" required autoComplete="cc-name" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="cardNumber">מספר כרטיס</Label>
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  required
                  autoComplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cardExpiry">תוקף (MM/YY)</Label>
                <Input
                  id="cardExpiry"
                  name="cardExpiry"
                  required
                  autoComplete="cc-exp"
                  placeholder="12/28"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cardCvv">CVV</Label>
                <Input
                  id="cardCvv"
                  name="cardCvv"
                  required
                  autoComplete="cc-csc"
                  inputMode="numeric"
                  maxLength={4}
                />
              </div>
              {/* TODO: Replace stub POST with Tranzila or Cardcom integration (Israeli processors). */}
            </div>
          )}
          {payment === "paypal" && (
            <p className="rounded-lg bg-background p-3 text-xs text-muted">
              תועברו ל-PayPal לאחר לחיצה על ״לתשלום״. {/* TODO: PayPal Business SDK */}
            </p>
          )}
          {payment === "bit" && (
            <p className="rounded-lg bg-background p-3 text-xs text-muted">
              תקבלו לינק Bit לתשלום. {/* TODO: Bit Business API */}
            </p>
          )}
        </section>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      <aside className="self-start space-y-4 rounded-2xl border border-border bg-surface p-5 md:sticky md:top-24">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          סיכום הזמנה · {count} פריטים
        </h2>
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 py-3">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-background">
                <Image src={item.image} alt={item.nameEn} fill sizes="60px" className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="line-clamp-1 font-display text-sm font-bold uppercase">
                  {item.team}
                </span>
                <span className="text-[11px] text-muted">
                  {versionLabel[item.version]} · {item.size} · ×{item.quantity}
                </span>
                {item.customization &&
                  (item.customization.name || item.customization.number) && (
                    <span className="text-[11px] text-accent">
                      {item.customization.name} {item.customization.number}
                    </span>
                  )}
              </div>
              <span className="font-display text-sm font-bold">
                {formatILS(lineTotal(item))}
              </span>
            </li>
          ))}
        </ul>
        <div className="space-y-1.5">
          <Label htmlFor="promo" className="text-[11px] uppercase text-muted">
            קוד קופון
          </Label>
          <div className="flex gap-2">
            <Input
              id="promo"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="PROMO10"
              className="h-10 rounded-full"
            />
            <Button type="button" size="sm" variant="outline">
              הפעלה
            </Button>
          </div>
        </div>
        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between text-muted">
            <dt>סיכום ביניים</dt>
            <dd className="font-display text-foreground">{formatILS(subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between text-muted">
            <dt>משלוח</dt>
            <dd className="font-display text-foreground">
              {shipping === 0 ? "חינם" : formatILS(shipping)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <dt className="font-display text-xs uppercase tracking-widest text-muted">
              סה״כ לתשלום
            </dt>
            <dd className="font-display text-xl font-black text-accent">
              {formatILS(total)}
            </dd>
          </div>
        </dl>
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> מעבד…
            </>
          ) : (
            <>לתשלום — {formatILS(total)}</>
          )}
        </Button>
        <p className="text-[11px] text-muted">
          בלחיצה על ״לתשלום״ אני מאשר/ת את תנאי השימוש ומדיניות ההחזרים. משלוח{" "}
          {SHIPPING.leadTimeDays} ימי עסקים.
        </p>
      </aside>
    </form>
  );
}
