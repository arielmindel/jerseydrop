import type { Metadata } from "next";
import { Trophy, Shield, Heart } from "lucide-react";
import WorldCupCountdown from "@/components/home/WorldCupCountdown";

export const metadata: Metadata = {
  title: "עלינו",
  description:
    "JerseyDrop היא מותג עצמאי ישראלי שמביא חולצות כדורגל רשמיות ישירות לבית שלכם. אהבה לכדורגל, איכות, ושירות בעברית.",
};

export default function AboutPage() {
  return (
    <>
      <section className="container py-14 md:py-20">
        <div className="max-w-2xl space-y-4">
          <span className="section-eyebrow">Our Story</span>
          <h1 className="font-display text-4xl font-black uppercase leading-[1.05] md:text-6xl">
            נולדנו מהאהבה <br />
            <span className="text-accent">לכדורגל</span>
          </h1>
          <p className="text-base leading-relaxed text-muted md:text-lg">
            JerseyDrop הוא מותג עצמאי ישראלי שהוקם מתוך מטרה אחת — להביא לכם את
            החולצות הטובות בעולם, במחיר נגיש, עם חוויית קנייה מהירה ושירות אמיתי
            בעברית.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            אנחנו בוחרים בעצמנו כל חולצה שעולה לקטלוג. אוהבים Fan Version? תקבלו
            בד רגיל בגזרה נעימה. רוצים Player Version כמו השחקנים עצמם? בד
            מיקרו-פייבר נושם, אור פלומה. מאמינים בשקיפות: המחיר הוא המחיר, משלוח
            לכל הארץ, והמשלוח שלכם יגיע תוך 10–15 ימי עסקים.
          </p>
        </div>
      </section>

      <section className="container grid gap-4 pb-10 md:grid-cols-3 md:pb-14">
        {[
          {
            icon: Trophy,
            title: "תשוקה לכדורגל",
            text: "אנחנו בוחרים קבוצות ועונות שהקהל הישראלי אוהב — מ-Messi ב-Inter Miami ועד Ronaldo בפורטוגל.",
          },
          {
            icon: Shield,
            title: "אחריות ושירות",
            text: "החלפות תוך 14 יום, תשלום מאובטח, וצוות שירות שעונה בוואטסאפ בעברית.",
          },
          {
            icon: Heart,
            title: "מותג עצמאי",
            text: "לא רשת, לא זיכיון — יזמים צעירים בישראל שבונים את המותג מחדר בבית.",
          },
        ].map((v) => (
          <div
            key={v.title}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <v.icon className="mb-3 h-5 w-5 text-accent" />
            <h3 className="mb-1 font-display text-base font-bold uppercase tracking-tight">
              {v.title}
            </h3>
            <p className="text-sm text-muted">{v.text}</p>
          </div>
        ))}
      </section>

      <section className="container py-10 md:py-16">
        <div className="rounded-3xl border border-border bg-surface p-6 md:p-10">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div className="space-y-3">
              <span className="section-eyebrow">June 11, 2026</span>
              <h2 className="font-display text-3xl font-black uppercase leading-tight md:text-4xl">
                מונדיאל בפתח. זה הזמן להתארגן.
              </h2>
              <p className="text-sm text-muted md:text-base">
                אנחנו פותחים את המונדיאל עם קולקציה ייחודית לנבחרות המובילות —
                ארגנטינה, ברזיל, פורטוגל, צרפת, ספרד, גרמניה ואנגליה.
              </p>
            </div>
            <WorldCupCountdown />
          </div>
        </div>
      </section>
    </>
  );
}
