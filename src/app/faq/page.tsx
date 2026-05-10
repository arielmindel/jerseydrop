import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "שאלות נפוצות | JerseyDrop",
  description:
    "התשובות לכל מה שתרצו לדעת על JerseyDrop — משלוחים, מחירים, התאמה אישית, החזרות.",
  alternates: { canonical: "/faq" },
};

const QUESTIONS: { id: string; q: string; a: string }[] = [
  {
    id: "shipping-time",
    q: "כמה זמן לוקח המשלוח?",
    a: "10-17 ימי עסקים מרגע אישור התשלום. כל חולצה נתפרת על פי הזמנה — זה הזמן שלוקח לייצר ולשלוח לישראל.",
  },
  {
    id: "authentic",
    q: "האם החולצות מקוריות?",
    a: "כן, מקוריות 100%. אנחנו עובדים ישירות עם יצרני החולצות, אותו בד, אותם פאצ׳ים, אותה איכות שתמצאו בחנות ספורט רשמית — רק במחיר נמוך משמעותית.",
  },
  {
    id: "name-number-cost",
    q: "כמה עולה הוספת שם ומספר?",
    a: "חינם. אצלנו שם, מספר ופאצ׳ הם חלק מהמחיר ולא תוספת. זה ה-USP שלנו — לא תמצאו את זה בשום אתר אחר.",
  },
  {
    id: "patches-cost",
    q: "כמה עולה פאצ׳ ייעודי?",
    a: "חינם. ניתן להוסיף פאצ׳ של ליגת האלופות, ליגה אירופית, פאצ׳ ליגה מקומית או נבחרת — בלי תוספת תשלום.",
  },
  {
    id: "returns",
    q: "אפשר להחזיר חולצה?",
    a: "כן, תוך 14 יום מקבלת המוצר במצב חדש. שימו לב — חולצות עם התאמה אישית (שם/מספר/פאצ׳) לא ניתנות להחזרה אלא במקרה של ליקוי ייצור. פרטים מלאים בעמוד מדיניות החזרות.",
  },
  {
    id: "payment",
    q: "אילו אמצעי תשלום אתם מקבלים?",
    a: "כרטיסי אשראי (Visa, Mastercard), ביט, ו-PayPal. כל התשלומים מאובטחים ב-HTTPS וסולק מורשה.",
  },
  {
    id: "tracking",
    q: "איך אני בודק את סטטוס ההזמנה?",
    a: "אישור הזמנה ומספר מעקב נשלחים אוטומטית למייל ולוואטסאפ ברגע שההזמנה יוצאת. אפשר לעקוב מהרגע הראשון ועד שהמשלוח אצלך.",
  },
  {
    id: "sizing",
    q: "איך אני יודע איזה מידה לבחור?",
    a: "בכל עמוד מוצר יש קישור למדריך מידות מלא עם טבלאות מידות בסנטימטרים. אם אתם בספק — שלחו הודעה ב-WhatsApp ונעזור.",
  },
  {
    id: "defective",
    q: "מה אם המוצר הגיע פגום?",
    a: "צרו קשר ב-WhatsApp תוך 48 שעות מקבלת המשלוח עם תמונות. אנחנו נטפל בזה מיד — החזר מלא או משלוח חלופי על חשבוננו.",
  },
  {
    id: "loyalty",
    q: "האם יש מועדון לקוחות?",
    a: "בקרוב! אנחנו עובדים על תוכנית נאמנות עם הטבות, הנחות מוקדמות וגישה לדגמים בלעדיים. הצטרפו לרשימת התפוצה כדי להיות הראשונים לדעת.",
  },
];

export default function FAQPage() {
  return (
    <LegalPage title="שאלות נפוצות">
      <p>
        כל מה שצריך לדעת לפני שמזמינים. אם השאלה שלך לא פה — שלחו לנו הודעה
        ב-WhatsApp או למייל.
      </p>
      <Accordion type="multiple" className="not-prose mt-6 space-y-3">
        {QUESTIONS.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 transition-colors data-[state=open]:border-[#00FF88]/40 data-[state=open]:bg-[#00FF88]/5"
          >
            <AccordionTrigger className="text-start font-display text-base font-bold leading-snug text-white md:text-lg">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-sm leading-relaxed text-white/75 md:text-base">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </LegalPage>
  );
}
