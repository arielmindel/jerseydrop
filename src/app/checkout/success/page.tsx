import Link from "next/link";
import type { Metadata } from "next";
import { Check, Truck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHIPPING } from "@/lib/constants";

export const metadata: Metadata = {
  title: "תודה על ההזמנה!",
  description: "ההזמנה התקבלה. נשלח לך עדכון במייל ברגע שהחולצה יוצאת לדרך.",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const orderNumber = searchParams.order || "JD000000";
  return (
    <section className="container flex min-h-[70vh] flex-col items-center justify-center gap-6 py-16 text-center md:py-24">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-accent/15 shadow-glow">
        <Check className="h-10 w-10 text-accent" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-black uppercase leading-tight md:text-5xl">
          תודה על ההזמנה!
        </h1>
        <p className="max-w-md text-sm text-muted md:text-base">
          קיבלנו את ההזמנה שלך. נשלח עדכון לאימייל ברגע שהחולצה יוצאת לדרך.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-surface px-6 py-4 text-center">
        <div className="font-display text-[11px] uppercase tracking-widest text-muted">
          מספר הזמנה
        </div>
        <div className="mt-1 font-display text-2xl font-black text-accent">
          {orderNumber}
        </div>
      </div>
      <div className="grid w-full max-w-md gap-3 md:grid-cols-2">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3 text-start text-xs text-muted">
          <Truck className="h-4 w-4 text-accent" />
          <span>משלוח: {SHIPPING.leadTimeDays} ימי עסקים</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3 text-start text-xs text-muted">
          <Mail className="h-4 w-4 text-accent" />
          <span>העדכונים יגיעו לאימייל</span>
        </div>
      </div>
      <Button asChild size="lg">
        <Link href="/">לעמוד הבית ←</Link>
      </Button>
    </section>
  );
}
