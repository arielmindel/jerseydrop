import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ITEMS: { id: string; q: string; a: string }[] = [
  {
    id: "shipping",
    q: "כמה זמן לוקח עד שהחולצה אצלי?",
    a: "10–15 ימי עסקים מיום ביצוע ההזמנה. הכל כלול — מכס, מע״מ, ודמי משלוח. אנחנו שומרים על זמני המשלוח האלה כל הזמן ומעדכנים אם משהו משתנה.",
  },
  {
    id: "fan-vs-player",
    q: "מה ההבדל בין Fan ל-Player?",
    a: "Fan Version זאת הגזרה הרגילה — בד איכותי, נראית בדיוק כמו של השחקנים, מתאימה לשימוש יומיומי. Player Version זאת חולצת המשחק עצמה — בד מיקרו-פייבר נושם, פחות משקל, נועדה למאמצים פיזיים. רוב הקונים בוחרים Fan.",
  },
  {
    id: "size",
    q: "איך מתאימים מידה?",
    a: "החולצות לפי גזרה אסיאתית — להזמין מידה אחת מעל המידה הרגילה. בעמוד המוצר יש מדריך מידות מלא עם טבלת מידות בס״מ. אם בספק נא לפנות אלינו לפני.",
  },
  {
    id: "name-number",
    q: "האם המחיר כולל שם ומספר?",
    a: "כן! התאמה אישית — שם, מספר ופאצ׳ רשמי של הליגה — חינם. אתם מזינים את השם והמספר בעמוד המוצר ורואים תצוגה מקדימה לפני התשלום.",
  },
  {
    id: "returns",
    q: "מה אם המידה לא מתאימה?",
    a: "החזרות עד 14 יום מקבלת המוצר, במצב חדש ובאריזה המקורית. שולחים לנו, אנחנו מחזירים את הכסף או מחליפים מידה. דמי משלוח חוזרים על חשבון הקונה.",
  },
  {
    id: "payment",
    q: "אילו אמצעי תשלום אתם מקבלים?",
    a: "כרטיס אשראי (Visa, Mastercard, American Express), PayPal, ו-Bit. כל הרכישות מאובטחות ב-SSL.",
  },
  {
    id: "authenticity",
    q: "האם החולצות מקוריות?",
    a: "החולצות שלנו הן רפליקות באיכות הגבוהה ביותר — אותו בד, אותם פאצ׳ים, אותם פרטים. אנחנו לא טוענים שהן רשמיות מהמועדון, אבל הן בלתי-ניתנות להבחנה במראה. כל הפרטים — שם, מספר, סמלים — מוטבעים באותו תהליך כמו במקור.",
  },
];

export default function HomepageFAQ() {
  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="section-eyebrow">FAQ</span>
        <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-tight md:text-5xl">
          שאלות נפוצות
        </h2>
        <p className="mt-3 text-sm text-muted md:text-base">
          כל מה שצריך לדעת לפני שמזמינים
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <Accordion type="single" defaultValue="shipping" collapsible className="space-y-3">
          {ITEMS.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
