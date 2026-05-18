import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";

const ITEMS: { id: string; q: string; a: string }[] = [
  {
    id: "shipping",
    q: "כמה זמן לוקח עד שהחולצה אצלי?",
    a: "10-17 ימי עסקים מיום ביצוע ההזמנה. הכל כלול — מכס, מע״מ, ודמי משלוח (30 ₪ למשלוח רגיל, חינם בקנייה מעל 250 ₪).",
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
    a: "כן! התאמה אישית — שם, מספר ופאצ׳ — חינם בכל החולצות. אתם מזינים את הפרטים בעמוד המוצר ורואים תצוגה מקדימה לפני התשלום.",
  },
  {
    id: "returns",
    q: "מה אם המידה לא מתאימה?",
    a: "החזרות עד 14 יום מקבלת המוצר, במצב חדש ובאריזה המקורית. שולחים לנו, אנחנו מחזירים את הכסף או מחליפים מידה. דמי משלוח חוזרים על חשבון הקונה.",
  },
  {
    id: "payment",
    q: "אילו אמצעי תשלום אתם מקבלים?",
    a: "כרטיסי אשראי (Visa, Mastercard, American Express, Diners, Isracard), Apple Pay, Google Pay וביט. עד 12 תשלומים ללא ריבית בכרטיס אשראי. כל הרכישות מאובטחות ב-SSL.",
  },
  {
    id: "authenticity",
    q: "האם החולצות מקוריות?",
    a: "החולצות שלנו הן רפליקות באיכות הגבוהה ביותר — אותו בד, אותם פאצ׳ים, אותם פרטים. אנחנו לא טוענים שהן רשמיות מהמועדון, אבל הן בלתי-ניתנות להבחנה במראה. כל הפרטים — שם, מספר, סמלים — מוטבעים באותו תהליך כמו במקור.",
  },
];

export default function HomepageFAQ() {
  return (
    <section className="container section-y">
      <header className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
        <SectionEyebrow>FAQ</SectionEyebrow>
        <h2 className="font-display text-display font-black uppercase">
          שאלות נפוצות
        </h2>
        <p className="text-body-sm text-muted md:text-body">
          כל מה שצריך לדעת לפני שמזמינים
        </p>
      </header>

      <div className="mx-auto mt-10 max-w-3xl md:mt-12">
        <Accordion type="single" defaultValue="shipping" collapsible className="space-y-3">
          {ITEMS.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="rounded-2xl border border-border-subtle bg-card px-5 transition-colors duration-base hover:border-accent/30 hover:bg-card-hover data-[state=open]:border-accent/50 data-[state=open]:bg-card-hover"
            >
              <AccordionTrigger className="text-start font-display text-body font-bold leading-snug">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-body-sm leading-relaxed text-muted">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
