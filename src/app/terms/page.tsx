import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "תקנון",
  description:
    "תקנון השימוש באתר JerseyDrop — תנאי רכישה, משלוח, החזרות, אחריות וסודיות.",
};

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. כללי",
    body: 'תקנון זה מסדיר את היחסים שבין JerseyDrop ("האתר") לבין הגולשים והמזמינים בו ("הלקוחות"). השימוש באתר ובשירותיו מהווה הסכמה מלאה לתנאי תקנון זה. JerseyDrop היא מותג עצמאי הפועל בישראל. למען הסר ספק — האתר אינו רשמי של אף מועדון או נבחרת המוצגים בו.',
  },
  {
    title: "2. רכישה באתר",
    body: "ניתן להזמין באתר רק מי שמלאו לו 18 שנים או בעל אישור הורה. הצעת המוצר באתר אינה מהווה התחייבות למלאי. כל הזמנה כפופה לאישור JerseyDrop ולזמינות מהספק. JerseyDrop רשאית לבטל הזמנה מסיבות של חוסר מלאי, טעות במחיר, או אי-עמידה בתנאי התקנון, ובמקרה כזה תוחזר התמורה במלואה.",
  },
  {
    title: "3. תשלומים",
    body: "התשלום באתר מתבצע באמצעות כרטיס אשראי (Visa, Mastercard, American Express), PayPal, או Bit. כל התשלומים מאובטחים ב-SSL. המחירים באתר כוללים מע״מ, אלא אם צוין אחרת. JerseyDrop רשאית לעדכן מחירים מעת לעת.",
  },
  {
    title: "4. משלוח",
    body: "זמן ההגעה הצפוי הוא 10–15 ימי עסקים מיום ביצוע ההזמנה. דמי משלוח, מכס ומע״מ כלולים במחיר. המשלוח מתבצע ישירות לכתובת שמסר הלקוח. לקוח שלא יקבל את הזמנתו תוך 21 ימי עסקים מתבקש לפנות אלינו. JerseyDrop אינה אחראית לעיכובים הנובעים מכוח עליון, שביתות, או בעיות במכס.",
  },
  {
    title: "5. החזרות וביטולים",
    body: "ניתן להחזיר מוצר תוך 14 ימים מקבלתו, במצב חדש ובאריזה המקורית. דמי המשלוח חזרה הם על חשבון הלקוח. יוחזר מלוא הסכום ששולם בניכוי דמי משלוח, תוך 14 ימי עסקים. חשוב: מוצרים שעברו התאמה אישית (שם ומספר על הגב) אינם ניתנים להחזרה לפי חוק הגנת הצרכן (פריט שיוצר במיוחד עבור הצרכן).",
  },
  {
    title: "6. אחריות",
    body: 'JerseyDrop אחראית לאיכות המוצרים כפי שתוארו באתר. במקרה של פגם או תקלה במוצר, יש ליצור קשר תוך 7 ימים מקבלת המוצר לקבלת החלפה או החזר מלא. למען הסר ספק — הלקוח מאשר שהמוצרים הם רפליקות באיכות גבוהה ואינם פריטים רשמיים מהמועדון. כל זכויות הקניין הרוחני (לוגואים, סמלים, שמות) שייכות לבעליהן החוקיים.',
  },
  {
    title: "7. סודיות ופרטיות",
    body: 'JerseyDrop שומרת על פרטיות הלקוחות בקפדנות. פרטים אישיים נאספים אך ורק לצורך ביצוע ההזמנה ומסירתה, ולא יועברו לצדדים שלישיים ללא הסכמת הלקוח, פרט לחברות משלוחים ועיבוד תשלומים. למידע מלא ראו את מדיניות הפרטיות.',
  },
  {
    title: "8. סמכות שיפוט",
    body: "כל סכסוך הנובע מהשימוש באתר זה יידון בבתי המשפט המוסמכים בתל אביב, ישראל. הדין הישראלי בלבד יחול.",
  },
  {
    title: "9. יצירת קשר",
    body: "לכל שאלה, פנייה או תלונה: hello@jerseydrop.co.il · WhatsApp: +972-53-3936304 · jerseydrop.co.il",
  },
];

export default function TermsPage() {
  return (
    <>
      <section className="border-b border-border/60 bg-background">
        <div className="container py-14 md:py-20">
          <span className="section-eyebrow">Legal</span>
          <h1 className="mt-3 font-display text-4xl font-black uppercase leading-tight md:text-5xl">
            תקנון
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted md:text-base">
            תנאי השימוש באתר JerseyDrop. עודכן לאחרונה: אפריל 2026.
          </p>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          {SECTIONS.map((s) => (
            <article key={s.title} className="space-y-2">
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-foreground md:text-2xl">
                {s.title}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted md:text-base">
                {s.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
