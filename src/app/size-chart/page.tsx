import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "טבלת מידות | JerseyDrop",
  description:
    "טבלאות מידות מלאות לחולצות מבוגרים (S-XXL) וילדים (16-28). מידות בד בסנטימטרים.",
  alternates: { canonical: "/size-chart" },
};

const ADULT_ROWS: { size: string; chest: string; length: string }[] = [
  { size: "S", chest: "88-92", length: "68" },
  { size: "M", chest: "96-100", length: "71" },
  { size: "L", chest: "104-108", length: "73" },
  { size: "XL", chest: "112-116", length: "75" },
  { size: "XXL", chest: "120-124", length: "77" },
];

const KIDS_ROWS: {
  size: string;
  age: string;
  chest: string;
  length: string;
}[] = [
  { size: "16", age: "5-6", chest: "58", length: "44" },
  { size: "18", age: "6-7", chest: "60", length: "47" },
  { size: "20", age: "7-8", chest: "64", length: "50" },
  { size: "22", age: "8-9", chest: "68", length: "53" },
  { size: "24", age: "9-10", chest: "72", length: "56" },
  { size: "26", age: "10-11", chest: "76", length: "59" },
  { size: "28", age: "11-12", chest: "80", length: "62" },
];

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-border bg-foreground/[0.05] px-3 py-3 text-end font-display text-sm font-bold uppercase tracking-wider text-[#00B85F]">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="border-b border-border px-3 py-3 text-end text-base text-foreground/85">
      {children}
    </td>
  );
}

export default function SizeChartPage() {
  // HowTo JSON-LD — Google + AI engines extract these as
  // "how to measure a jersey" answers in instant results.
  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "איך לבחור מידת חולצת כדורגל נכונה",
    description:
      "מדריך מקצועי לבחירת מידת חולצת כדורגל לפי מדידות גוף בסנטימטרים.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "מדידת היקף החזה",
        text: "מדוד את היקף הגוף בנקודה הרחבה ביותר מתחת לבית השחי, מסביב לכתפיים, עם סרט מדידה הצמוד לגוף אך לא מתוח.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "מדידת אורך החולצה",
        text: "מדוד מהקצה של הצווארון מאחור עד התחתית של החולצה.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "השוואה לטבלת המידות",
        text: "השווה את המידות בסנטימטרים לטבלת המבוגרים (S–XXL) או הילדים (16–28).",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "בחירה בין שתי מידות",
        text: "אם אתה בין שתי מידות — קח את הגדולה. המידות הן מידות בד, לא מידות גוף.",
      },
    ],
  };

  return (
    <LegalPage title="טבלת מידות">
      <JsonLd data={howToLd} />
      <p>
        הטבלאות הבאות מציגות את המידות המדויקות של החולצות שלנו{" "}
        <strong>בסנטימטרים</strong>. אם אתה בין שתי מידות — אנחנו ממליצים
        לקחת את הגדולה.
      </p>

      <h2>חולצות מבוגרים (S–XXL)</h2>
      <div className="not-prose overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>מידה</Th>
              <Th>חזה (ס״מ)</Th>
              <Th>אורך (ס״מ)</Th>
            </tr>
          </thead>
          <tbody>
            {ADULT_ROWS.map((r) => (
              <tr key={r.size}>
                <Td>
                  <strong className="text-foreground">{r.size}</strong>
                </Td>
                <Td>{r.chest}</Td>
                <Td>{r.length}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>חולצות ילדים (16–28)</h2>
      <div className="not-prose overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>מידה</Th>
              <Th>גיל</Th>
              <Th>חזה (ס״מ)</Th>
              <Th>אורך (ס״מ)</Th>
            </tr>
          </thead>
          <tbody>
            {KIDS_ROWS.map((r) => (
              <tr key={r.size}>
                <Td>
                  <strong className="text-foreground">{r.size}</strong>
                </Td>
                <Td>{r.age}</Td>
                <Td>{r.chest}</Td>
                <Td>{r.length}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>איך מודדים נכון?</h2>
      <ul>
        <li>
          <strong>חזה</strong> — היקף הגוף בנקודה הרחבה ביותר מתחת לבית
          השחי, מסביב לכתפיים
        </li>
        <li>
          <strong>אורך</strong> — מהקצה של הצווארון מאחור עד התחתית של
          החולצה
        </li>
        <li>
          המידות הן <strong>מידות בד</strong> ולא מידות גוף — קח בחשבון
          מקום נוח לתנועה
        </li>
      </ul>

      <p>
        בספק? שלח לנו הודעה ב-WhatsApp עם המידות שלך, ונגיד לך איזה מידה
        להזמין.
      </p>
    </LegalPage>
  );
}
