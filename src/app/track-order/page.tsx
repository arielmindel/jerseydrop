import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";
import TrackOrderForm from "./TrackOrderForm";

export const metadata: Metadata = {
  title: "מעקב הזמנה | JerseyDrop",
  description:
    "בדוק את סטטוס ההזמנה שלך ב-JerseyDrop — מעקב מהיר ב-WhatsApp.",
  alternates: { canonical: "/track-order" },
};

export default function TrackOrderPage() {
  return (
    <LegalPage title="מעקב הזמנה">
      <p>
        רוצה לבדוק איפה ההזמנה שלך? הזן את מספר ההזמנה והמייל שאיתו הזמנת
        — ננתב אותך לצוות שלנו ב-WhatsApp עם כל הפרטים מוכנים.
      </p>
      <p className="rounded-xl border border-[#00B85F]/20 bg-[#00B85F]/5 p-4 text-sm">
        💡 מעקב אוטומטי מלא יושק בקרוב. בינתיים — אנחנו עונים תוך 24 שעות
        ב-WhatsApp.
      </p>
      <div className="not-prose mt-6">
        <TrackOrderForm />
      </div>
      <h2>מה כל סטטוס אומר?</h2>
      <ul>
        <li>
          <strong>בייצור</strong> — היצרן עובד על החולצה שלך (1–7 ימי
          עסקים)
        </li>
        <li>
          <strong>נשלח</strong> — החולצה יצאה מהיצרן וטסה לישראל (3–7 ימי
          עסקים)
        </li>
        <li>
          <strong>במחסן בארץ</strong> — שחרור מהמכס וסידור למשלוח (1–2 ימי
          עסקים)
        </li>
        <li>
          <strong>בדרך אליך</strong> — מספר מעקב פעיל, מגיע תוך 1–2 ימי
          עסקים
        </li>
        <li>
          <strong>נמסר</strong> — החולצה אצלך 🎉
        </li>
      </ul>
    </LegalPage>
  );
}
