import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "מדיניות משלוחים | JerseyDrop",
  description:
    "כל מה שצריך לדעת על משלוחים ב-JerseyDrop: זמני אספקה, עלויות, מכס, ואופן המשלוח.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPolicyPage() {
  return (
    <LegalPage title="מדיניות משלוחים">
      <p>
        ב-JerseyDrop כל חולצה <strong>נתפרת על פי הזמנה</strong> כדי להבטיח
        מקוריות, איכות והתאמה. זה אומר שאיננו מחזיקים מלאי מוכן — זמן הייצור
        והמשלוח הוא <strong>10-17 ימי עסקים</strong> מרגע אישור התשלום.
      </p>
      <h2>אופן המשלוח</h2>
      <p>
        המשלוח מתבצע באמצעות שירות עסקי מהיר. ניתן לבחור בין משלוח עד הבית או
        איסוף מנקודות <strong>Boxit</strong> ברחבי הארץ — לפי הנוחות שלך.
      </p>
      <h2>עלות משלוח</h2>
      <ul>
        <li>
          <strong>משלוח רגיל</strong>: 30 ש״ח
        </li>
        <li>
          <strong>משלוח חינם</strong>: בקנייה מעל 250 ש״ח
        </li>
      </ul>
      <h2>מכס ומיסים</h2>
      <p>
        <strong>המכס כלול במחיר.</strong> אין תשלומים נוספים בקבלת המשלוח —
        כל מה שמופיע בעגלה הוא המחיר הסופי.
      </p>
      <h2>מעקב הזמנה</h2>
      <p>
        אישור הזמנה ומספר מעקב נשלחים אוטומטית למייל ולוואטסאפ. אפשר לעקוב
        אחרי המשלוח מהרגע שיצא מהיצרן ועד שהוא מגיע אליך.
      </p>
      <h2>שאלות?</h2>
      <p>
        תמיד אפשר לשלוח לנו הודעה ב-WhatsApp או למייל{" "}
        <a href="mailto:hello@jerseydrop.co.il">hello@jerseydrop.co.il</a> —
        אנחנו עונים תוך 24 שעות.
      </p>
    </LegalPage>
  );
}
