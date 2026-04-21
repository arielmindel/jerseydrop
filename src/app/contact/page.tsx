import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import { MessageCircle, Mail, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "צור קשר",
  description: "שאלות? נשמח לעזור. WhatsApp, אימייל, וטופס פנייה.",
};

const FAQ = [
  {
    q: "כמה זמן לוקח משלוח?",
    a: "10–15 ימי עסקים ישירות לבית, כולל דמי משלוח ומכס.",
  },
  {
    q: "איך מחזירים מוצר?",
    a: "ניתן להחזיר עד 14 יום מקבלת החולצה, החזר כספי מלא. חולצות עם שם ומספר מותאמים אינן ניתנות להחזרה.",
  },
  {
    q: "האם המחיר כולל שם ומספר?",
    a: "לא. תוספת 30 ₪ בלבד על שם ומספר בגב החולצה.",
  },
  {
    q: "מה ההבדל בין Fan ל-Player?",
    a: "Fan Version בגזרה רגילה ובד פוליאסטר. Player Version בגזרה נאמנה לזו של השחקנים עצמם, בד מיקרו-פייבר נושם ופחות משקל.",
  },
  {
    q: "יש מידות לילדים?",
    a: "בקרוב — נוסיף מידות ילדים בקולקציה הבאה.",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="container py-12 md:py-16">
        <div className="max-w-2xl space-y-3">
          <span className="section-eyebrow">Contact</span>
          <h1 className="font-display text-4xl font-black uppercase leading-tight md:text-5xl">
            נשמח לעזור
          </h1>
          <p className="text-sm text-muted md:text-base">
            שאלה על חולצה? מידה? משלוח? בחרו את הדרך הכי נוחה לכם.
          </p>
        </div>
      </section>

      <section className="container grid gap-6 pb-10 md:grid-cols-3">
        <a
          href="https://wa.me/972000000000"
          className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/60"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-sm font-bold uppercase">WhatsApp</div>
            <div className="text-xs text-muted">מענה מהיר (גם בעברית)</div>
          </div>
        </a>
        <a
          href="mailto:hello@jerseydrop.co.il"
          className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/60"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-sm font-bold uppercase">אימייל</div>
            <div className="text-xs text-muted">hello@jerseydrop.co.il</div>
          </div>
        </a>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-sm font-bold uppercase">שעות פעילות</div>
            <div className="text-xs text-muted">ראשון-חמישי 9:00-19:00</div>
          </div>
        </div>
      </section>

      <section className="container grid gap-10 pb-16 md:grid-cols-[1fr_1.2fr]">
        <ContactForm />

        <div className="space-y-3">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight md:text-3xl">
            שאלות נפוצות
          </h2>
          <ul className="space-y-2">
            {FAQ.map((item) => (
              <li key={item.q} className="rounded-2xl border border-border bg-surface">
                <details className="group p-4">
                  <summary className="flex cursor-pointer items-center justify-between font-display text-sm font-semibold text-foreground">
                    {item.q}
                    <span className="text-accent transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-muted">{item.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
