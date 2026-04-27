import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description:
    "כיצד JerseyDrop אוספת, משתמשת ושומרת מידע אישי. עוגיות, זכויות הצרכן, אבטחה.",
};

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. מידע שאנחנו אוספים",
    body: 'בעת הזמנה אנחנו אוספים את הפרטים הבאים: שם מלא, אימייל, מספר טלפון, כתובת למשלוח, ופרטי תשלום (פרטי האשראי עוברים ישירות לחברת הסליקה ולא נשמרים אצלנו). בעת גלישה באתר, אנחנו אוספים מידע אנונימי על דפים שביקרת בהם, מכשיר וכתובת IP — לצורך שיפור החוויה.',
  },
  {
    title: "2. איך אנחנו משתמשים במידע",
    body: "המידע נאסף ומשמש למטרות הבאות בלבד: ביצוע ושליחת ההזמנה, תקשורת על מצב ההזמנה, ייעול חוויית האתר, שליחת עדכונים שיווקיים (רק עם הסכמה מפורשת), ועמידה בדרישות חוקיות (כגון רישום למסמכי משלוח, מע״מ).",
  },
  {
    title: "3. עוגיות (Cookies)",
    body: 'האתר משתמש בעוגיות חיוניות (לתחזוקה של עגלת הקניות, התחברות, העדפות שפה) ובעוגיות אנליטיות (Google Analytics, Vercel Analytics) שמסייעות לנו להבין איך המשתמשים מתנהגים. ניתן לבטל עוגיות לא חיוניות דרך הגדרות הדפדפן. ביטול עוגיות חיוניות עלול לפגוע בתפקוד האתר.',
  },
  {
    title: "4. שיתוף מידע עם צדדים שלישיים",
    body: "אנחנו לא מוכרים, משכירים או חולקים מידע אישי עם צדדים שלישיים, פרט ל: חברות משלוחים (לצורך מסירת ההזמנה), חברות סליקת אשראי (לצורך עיבוד התשלום), שירותי דיוור (לצורך שליחת עדכוני הזמנה ושיווק עם הסכמה). כל הספקים האלה כפופים להסכמי סודיות.",
  },
  {
    title: "5. זכויותיכם",
    body: "ברוח GDPR וחוק הגנת הפרטיות הישראלי, יש לכם זכות: לגשת למידע האישי שלכם, לתקן פרטים שגויים, למחוק את חשבונכם, להפסיק קבלת דיוור (Unsubscribe בכל מייל), ולקבל עותק של המידע שאנחנו מחזיקים. ניתן לממש זכויות אלה דרך פנייה ל-hello@jerseydrop.co.il.",
  },
  {
    title: "6. אבטחה",
    body: "האתר מאובטח ב-SSL (HTTPS). פרטי האשראי עוברים ישירות לחברת הסליקה (Tranzila / Cardcom) ואינם נשמרים אצלנו. אנחנו משתמשים בסיסמאות חזקות ובהצפנה לכל נתון אישי. אם נגלה פריצת מידע — נודיע לכם תוך 72 שעות, כמתחייב בחוק.",
  },
  {
    title: "7. שמירת מידע",
    body: "נתוני הזמנה נשמרים אצלנו במשך 7 שנים לצורך עמידה בדרישות מס הכנסה ורשות המסים. נתוני שיווק נשמרים כל עוד יש לכם חשבון או הסכמה לדיוור.",
  },
  {
    title: "8. שינויים במדיניות",
    body: "אנחנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יישלחו לכם במייל. המדיניות העדכנית תתפרסם תמיד באתר.",
  },
  {
    title: "9. יצירת קשר",
    body: "לכל שאלה על פרטיות: hello@jerseydrop.co.il · jerseydrop.co.il · WhatsApp: +972-53-3936304",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="border-b border-border/60 bg-background">
        <div className="container py-14 md:py-20">
          <span className="section-eyebrow">Legal</span>
          <h1 className="mt-3 font-display text-4xl font-black uppercase leading-tight md:text-5xl">
            מדיניות פרטיות
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted md:text-base">
            איך אנחנו אוספים ומשתמשים במידע אישי. עודכן לאחרונה: אפריל 2026.
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
