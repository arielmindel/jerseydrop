import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Sparkles, Truck, Heart, ArrowLeft, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/constants";

export const metadata: Metadata = {
  title: "חולצה בהפתעה — JerseyDrop Mystery Drop",
  description:
    "הזמינו חולצה בהפתעה — אנחנו נבחר עבורכם חולצה איכותית מהקטלוג. חוויה ייחודית, מחיר מיוחד.",
};

const FEATURES = [
  {
    Icon: Sparkles,
    titleHe: "אנחנו בוחרים, אתם מתפעלים",
    text: "תקבלו חולצה איכותית מהקטלוג שלנו — קבוצה גדולה, צבעים שיושבים יחד עם הסגנון שאתם בוחרים.",
  },
  {
    Icon: Truck,
    titleHe: "משלוח 10–15 ימי עסקים",
    text: "אותו זמן משלוח כמו כל פריט אחר — אנחנו לא שומרים אתכם בלי-יודע.",
  },
  {
    Icon: Heart,
    titleHe: "אם לא אהבתם — מחזירים",
    text: "החזרה תוך 14 יום, החלפה למוצר מהקטלוג הרגיל, או החזר כספי מלא.",
  },
];

export default function SurprisePage() {
  const message = "היי! מתעניין/ת בחולצה בהפתעה — Mystery Drop. אפשר שתספרו לי איך זה עובד?";

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/60 bg-background">
        <div
          aria-hidden
          className="absolute inset-0 opacity-95"
          style={{
            backgroundImage:
              "radial-gradient(at 18% 12%, rgba(252, 211, 77, 0.22) 0px, transparent 55%), radial-gradient(at 90% 30%, rgba(245, 158, 11, 0.18) 0px, transparent 50%)",
          }}
        />
        <div className="container relative py-16 md:py-24">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-amber" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-amber">
              MYSTERY DROP
            </span>
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black uppercase leading-[1.05] md:text-6xl">
            חולצה <span className="text-amber">בהפתעה</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted md:text-lg">
            תזמינו, אנחנו נבחר ונפתיע. חוויה אחת אחת — חולצה איכותית מהקטלוג
            שלנו במחיר מיוחד.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-amber px-6 font-display text-sm font-bold uppercase tracking-wide text-background shadow-gold transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle className="h-4 w-4" />
              דברו איתנו בוואטסאפ
            </a>
            <Link
              href="/products"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-surface px-6 font-display text-sm font-bold uppercase tracking-wide text-foreground"
            >
              בכל מקרה לקטלוג <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.titleHe}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber/15 text-amber">
                <f.Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 font-display text-base font-bold uppercase tracking-tight">
                {f.titleHe}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-16">
        <div className="rounded-3xl border border-amber/30 bg-amber/5 p-6 md:p-10">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight md:text-3xl">
            איך זה עובד?
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted md:text-base">
            <li>
              <strong className="text-foreground">1. שלחו הודעה.</strong> WhatsApp או
              אימייל. תספרו לנו את המידה ואת הסגנון שאתם אוהבים (קלאסי / סטריט / רטרו).
            </li>
            <li>
              <strong className="text-foreground">2. אנחנו בוחרים.</strong> אנחנו
              נסרוק את הקטלוג ונבחר חולצה שמתאימה לכם — כזו שתאהבו.
            </li>
            <li>
              <strong className="text-foreground">3. תשלום מיוחד.</strong> מחיר מיוחד
              שיוסכם עליו — בדרך כלל זול ב-15-25 ₪ ממחיר הקטלוג.
            </li>
            <li>
              <strong className="text-foreground">4. הפתעה!</strong> החולצה מגיעה
              באריזה מסתורית — אתם פותחים, רואים, נהנים.
            </li>
          </ol>
          <div className="mt-6 rounded-xl border border-border bg-background p-4 text-xs text-muted">
            ⚠️ אם לא אהבתם — אנחנו לא נעלבים. החזרה תוך 14 יום, החזר מלא או
            החלפה לחולצה ספציפית מהקטלוג.
          </div>
        </div>
      </section>
    </>
  );
}
