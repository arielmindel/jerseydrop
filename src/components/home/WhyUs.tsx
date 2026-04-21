import { Shield, Pencil, Truck } from "lucide-react";

const ITEMS = [
  {
    icon: Shield,
    title: "איכות מקורית",
    description:
      "בדים רשמיים, חיתוך מדויק, דגמים עדכניים של העונה — הכל כמו בעולם הגדול.",
  },
  {
    icon: Pencil,
    title: "התאמה אישית",
    description:
      "שם ומספר משלך על הגב (30 ₪ בלבד). תלחצו על החולצה, תקלידו, ותראו תצוגה מקדימה חיה.",
  },
  {
    icon: Truck,
    title: "משלוח מהיר",
    description:
      "10–15 ימי עסקים ישירות לבית. מחיר כולל מכס. משלוח חינם בהזמנות מעל 249 ₪.",
  },
];

export default function WhyUs() {
  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-surface/40 py-16 md:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,136,0.08),transparent_60%)]"
      />
      <div className="container relative">
        <div className="mb-10 max-w-2xl space-y-2 md:mb-14">
          <span className="section-eyebrow">Why JerseyDrop</span>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight md:text-5xl">
            למה כדאי לכם אצלנו
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {ITEMS.map((item) => (
            <div
              key={item.title}
              className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-background p-6 transition-colors hover:border-accent/40 md:p-7"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
