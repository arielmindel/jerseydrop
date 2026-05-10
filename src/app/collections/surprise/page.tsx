import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Gift, Sparkles, Truck, Heart } from "lucide-react";
import MysteryBoxBuilder from "@/components/mystery/MysteryBoxBuilder";
import { getAllProducts, getPriceTier, TIER_META } from "@/lib/products";

export const metadata: Metadata = {
  title: "חולצה בהפתעה — JerseyDrop Mystery Drop",
  description:
    "בנו את הקופסה: בחרו כמות, סוג (רטרו / ארוכה / מיוחדת) ומידה לכל חולצה. אנחנו בוחרים את החולצה עצמה לפי הזמין במלאי.",
};

const FEATURES = [
  {
    Icon: Sparkles,
    titleHe: "אנחנו בוחרים, אתם מתפעלים",
    text: "תקבלו חולצה איכותית מהקטלוג שלנו — קבוצה גדולה, צבעים שיושבים יחד עם הסגנון שאתם בוחרים.",
  },
  {
    Icon: Truck,
    titleHe: "משלוח 10-17 ימי עסקים",
    text: "אותו זמן משלוח כמו כל פריט אחר — אנחנו לא שומרים אתכם בלי-יודע.",
  },
  {
    Icon: Heart,
    titleHe: "אם לא אהבתם — מחזירים",
    text: "החזרה תוך 14 יום, החלפה למוצר מהקטלוג הרגיל, או החזר כספי מלא.",
  },
];

export default function SurprisePage() {
  // Find the canonical mystery product to anchor cart lines (image, ids).
  // Type+size choices live in customerNotes; this just gives the cart a
  // pretty image + name + a real productId so server-side joins still work.
  const mysteryProduct = getAllProducts().find(
    (p) => getPriceTier(p) === "mystery",
  );
  if (!mysteryProduct) notFound();
  const unitPrice = TIER_META.mystery.price;
  const fallbackImg =
    "https://picsum.photos/seed/jerseydrop-mystery/800/1000";
  const image = mysteryProduct.images?.[0] || fallbackImg;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border/60 bg-background">
        <div
          aria-hidden
          className="absolute inset-0 opacity-95"
          style={{
            backgroundImage:
              "radial-gradient(at 18% 12%, rgba(252, 211, 77, 0.22) 0px, transparent 55%), radial-gradient(at 90% 30%, rgba(245, 158, 11, 0.18) 0px, transparent 50%)",
          }}
        />
        <div className="container relative py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-amber" />
                <span className="font-display text-xs font-bold uppercase tracking-widest text-amber">
                  MYSTERY DROP
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-black uppercase leading-[1.05] md:text-6xl">
                חולצה <span className="text-amber">בהפתעה</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm text-muted md:text-lg">
                תבחרו כמות (ללא הגבלה), קהל, סוג ומידה לכל חולצה — וגם מה
                פחות אוהבים. אנחנו נבחר את החולצה עצמה לפי הזמין במלאי.
              </p>
            </div>
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-amber/40 bg-surface shadow-2xl"
              style={{
                boxShadow: "0 30px 60px -20px rgba(252,211,77,0.30), 0 0 0 1px rgba(252,211,77,0.20)",
              }}
            >
              <Image
                src="/categories/mystery.jpg"
                alt="Mystery Box — חולצה בהפתעה"
                fill
                priority
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "linear-gradient(180deg, transparent 60%, rgba(11,18,32,0.55) 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Configurator */}
      <section className="container py-8 md:py-12">
        <MysteryBoxBuilder
          productId={mysteryProduct.id}
          slug={mysteryProduct.slug}
          nameHe="Mystery Box · חולצה בהפתעה"
          nameEn={mysteryProduct.nameEn || "Mystery Box"}
          team={mysteryProduct.team || "Mystery"}
          image={image}
          unitPrice={unitPrice}
        />
      </section>

      {/* Features */}
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

      {/* How it works */}
      <section className="container pb-16">
        <div className="rounded-3xl border border-amber/30 bg-amber/5 p-6 md:p-10">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight md:text-3xl">
            איך זה עובד?
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted md:text-base">
            <li>
              <strong className="text-foreground">1. בחרו כמות.</strong> כל חולצה
              ב-99 ₪. ללא הגבלה — קנו כמה שאתם רוצים.
            </li>
            <li>
              <strong className="text-foreground">2. הגדירו לכל חולצה.</strong>{" "}
              קהל (בוגרים / ילדים), סוג (רגילה / רטרו / ארוכה / מיוחדת)
              ומידה — בנפרד לכל חולצה.
            </li>
            <li>
              <strong className="text-foreground">3. סננו העדפות.</strong>{" "}
              צבעים וקבוצות שאתם פחות אוהבים — נשתדל לא לבחור עבורכם משהו
              שלא תיהנו ממנו.
            </li>
            <li>
              <strong className="text-foreground">4. אנחנו בוחרים.</strong>{" "}
              צוות הבחירה שלנו סורק את הקטלוג לפי ההעדפות שלכם וקובע את
              החולצה הספציפית.
            </li>
            <li>
              <strong className="text-foreground">5. הפתעה.</strong> החולצה
              מגיעה באריזה רגילה — אתם פותחים, רואים, נהנים.
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
