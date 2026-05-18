import { Shield, Pencil, Truck } from "lucide-react";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";

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
      "שם ומספר משלך על הגב — ללא תוספת תשלום. תלחצו על החולצה, תקלידו, ותראו תצוגה מקדימה חיה.",
  },
  {
    icon: Truck,
    title: "משלוח מהיר",
    description:
      "10-17 ימי עסקים ישירות לבית. מחיר כולל מכס. משלוח חינם בהזמנות מעל 250 ₪.",
  },
];

export default function WhyUs() {
  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-surface/40 section-y">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,136,0.08),transparent_60%)]"
      />
      <div className="container relative">
        <header className="mb-10 max-w-2xl space-y-3 md:mb-14">
          <SectionEyebrow>Why JerseyDrop</SectionEyebrow>
          <h2 className="font-display text-display font-black uppercase">
            למה כדאי לכם אצלנו
          </h2>
        </header>
        <div className="reveal-grid grid gap-5 md:grid-cols-3 lg:gap-6">
          {ITEMS.map((item) => (
            <div
              key={item.title}
              className="reveal-item group relative flex flex-col gap-3 rounded-2xl border border-border bg-background edge-light p-6 transition-all duration-base ease-emphasized hover:-translate-y-1 hover:border-accent/40 hover:shadow-glow-sm md:p-7"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent transition-transform duration-base group-hover:scale-110">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-h2 font-bold uppercase tracking-tight">
                {item.title}
              </h3>
              <p className="text-body-sm leading-relaxed text-muted">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
