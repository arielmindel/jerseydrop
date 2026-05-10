"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

/**
 * "Why JerseyDrop?" — competitive advantages comparison section.
 *
 * Side-by-side comparison of how JerseyDrop differs from typical jersey
 * shops on 9 dimensions. Mobile gets stacked cards (one per row, with
 * us/them grids inside); desktop gets a clean 3-column table layout
 * (label / us / them).
 *
 * Animations: section fades up on enter; rows stagger in 50ms apart.
 */

type ComparisonRow = {
  label: string;
  ours: string;
  theirs: string;
};

const ROWS: ComparisonRow[] = [
  {
    label: "שם ומספר על החולצה",
    ours: "חינם — כלול בכל הזמנה",
    theirs: "30-80 ₪ תוספת",
  },
  {
    label: "פאצ׳ים (ליגת אלופות, נבחרות)",
    ours: "חינם — כלול בכל הזמנה",
    theirs: "20-50 ₪ תוספת",
  },
  {
    label: "תצוגה חיה של שם + מספר",
    ours: "רואה איך זה ייראה לפני הקנייה",
    theirs: "קונה בעיניים עצומות",
  },
  {
    label: "איכות החולצה",
    ours: "מקורית 100% — ייצור היצרן",
    theirs: "חיקויים זולים",
  },
  {
    label: "שירות לקוחות",
    ours: "WhatsApp בעברית תוך 24 שעות",
    theirs: "אימייל באנגלית, ימים-שבועות",
  },
  {
    label: "קטלוג",
    ours: "1,600+ חולצות, כל הליגות",
    theirs: "50-200 חולצות, מבחר מצומצם",
  },
  {
    label: "משלוח",
    ours: "25 ₪ / חינם מעל 200 ₪",
    theirs: "50-100 ₪ + מיסים נסתרים",
  },
  {
    label: "החזרות",
    ours: "14 יום, פשוט",
    theirs: "אין החזרות / מסובך",
  },
  {
    label: "תשלום",
    ours: "אשראי · Apple Pay · Google Pay · ביט · עד 12 תשלומים",
    theirs: "רק אשראי / רק PayPal",
  },
];

export default function WhyJerseydrop() {
  return (
    <section
      aria-label="למה JerseyDrop"
      className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-black to-slate-950 py-16 md:py-24"
    >
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-12 text-center md:mb-16"
        >
          <p className="font-display text-xs font-bold uppercase tracking-[0.32em] text-[#00FF88] md:text-sm">
            THE JERSEYDROP DIFFERENCE
          </p>
          <h2 className="mt-3 font-display text-3xl font-black md:text-5xl">
            למה <span className="text-[#00FF88]">JerseyDrop?</span>
          </h2>
          <p className="mt-4 text-base text-white/70 md:text-lg">
            מה אנחנו עושים אחרת מכל חנות אחרת
          </p>
        </motion.header>

        {/* ===== DESKTOP — 3-column table ===== */}
        <div className="hidden md:block">
          {/* column headers */}
          <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)] gap-3 px-2 pb-4">
            <div></div>
            <div className="rounded-t-xl bg-[#00FF88]/10 px-4 py-3 text-center font-display text-sm font-black uppercase tracking-widest text-[#00FF88]">
              JerseyDrop
            </div>
            <div className="rounded-t-xl bg-red-500/10 px-4 py-3 text-center font-display text-sm font-black uppercase tracking-widest text-red-300">
              חנויות אחרות
            </div>
          </div>
          <ul className="space-y-2">
            {ROWS.map((r, i) => (
              <motion.li
                key={r.label}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
                className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)] gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-2 py-1 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-end px-3 py-3 text-end font-display text-base font-semibold text-white">
                  {r.label}
                </div>
                <div className="flex items-center gap-2.5 rounded-lg bg-[#00FF88]/[0.06] px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#00FF88]" />
                  <span className="text-base font-medium text-white">{r.ours}</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg bg-red-500/[0.06] px-4 py-3">
                  <XCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
                  <span className="text-base text-white/60">{r.theirs}</span>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* ===== MOBILE — stacked cards ===== */}
        <div className="space-y-4 md:hidden">
          {ROWS.map((r, i) => (
            <motion.article
              key={r.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
            >
              {/* Row label */}
              <h3 className="border-b border-white/10 bg-white/[0.03] px-4 py-3 text-center font-display text-sm font-bold text-white">
                {r.label}
              </h3>
              {/* Us / Them */}
              <div className="grid grid-cols-2 gap-px bg-white/10">
                <div className="flex flex-col items-start gap-2 bg-[#00FF88]/[0.08] p-3">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#00FF88]" />
                    <span className="font-display text-[10px] font-black uppercase tracking-widest text-[#00FF88]">
                      JerseyDrop
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-snug text-white">
                    {r.ours}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 bg-red-500/[0.08] p-3">
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="font-display text-[10px] font-black uppercase tracking-widest text-red-300">
                      אחרים
                    </span>
                  </div>
                  <p className="text-sm leading-snug text-white/65">
                    {r.theirs}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* ===== CTA ===== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="mt-12 text-center md:mt-16"
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-[#00FF88] px-10 py-4 font-display text-lg font-bold uppercase tracking-wide text-black shadow-[0_18px_50px_-10px_rgba(0,255,136,0.55)] transition-transform duration-200 hover:scale-105 active:scale-95 md:text-xl"
          >
            התחל לקנות עכשיו
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
