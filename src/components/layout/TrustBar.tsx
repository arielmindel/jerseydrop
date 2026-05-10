import { Truck, Shield, RotateCw, Lock } from "lucide-react";

/**
 * Site-wide trust bar — sits above the Footer on every page.
 * 2-col on mobile, 4-col inline on desktop. Each pillar is a neon-green
 * icon over a bold title + muted subtitle.
 */

const PILLARS = [
  {
    Icon: Truck,
    title: "משלוח 10-17 ימים",
    sub: "ישר מהיצרן",
  },
  {
    Icon: Shield,
    title: "איכות מקורית",
    sub: "100% אותנטי",
  },
  {
    Icon: RotateCw,
    title: "14 יום החזרה",
    sub: "ללא שאלות",
  },
  {
    Icon: Lock,
    title: "תשלום מאובטח",
    sub: "אשראי · Apple Pay · Google Pay · ביט · עד 12 תשלומים",
  },
];

export default function TrustBar() {
  return (
    <section
      aria-label="הבטחות JerseyDrop"
      className="border-y border-white/10 bg-surface/60"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-6 md:grid-cols-4 md:gap-8 md:px-6 md:py-8 lg:px-8">
        {PILLARS.map((p) => (
          <div
            key={p.title}
            className="flex items-start gap-3 md:flex-col md:items-start md:gap-2"
          >
            <p.Icon
              aria-hidden
              className="h-7 w-7 flex-shrink-0 text-[#00FF88] md:h-8 md:w-8"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold text-white">
                {p.title}
              </span>
              <span className="mt-0.5 text-sm text-white/60">{p.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
