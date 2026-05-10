import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "הצהרת נגישות | JerseyDrop",
  description:
    "הצהרת הנגישות של אתר JerseyDrop בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityStatementPage() {
  return (
    <LegalPage title="הצהרת נגישות">
      <p>
        אתר JerseyDrop פועל בהתאם ל
        <strong>
          חוק שוויון זכויות לאנשים עם מוגבלות, התשנ״ח-1998
        </strong>{" "}
        ולתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות),
        התשע״ג-2013.
      </p>
      <p>
        אנו מחויבים להנגיש את האתר לכלל המשתמשים, לרבות אנשים עם מוגבלות,
        ולספק חוויית גלישה איכותית, בטוחה ושוויונית.
      </p>

      <h2>רמת הנגישות באתר</h2>
      <p>
        האתר נבנה בהתאם להוראות תקן הישראלי{" "}
        <strong>ת״י 5568</strong> וברמת נגישות{" "}
        <strong>AA</strong> לפי הקווים המנחים של W3C{" "}
        <strong>WCAG 2.1</strong>.
      </p>

      <h2>אפשרויות הנגישות הזמינות באתר</h2>
      <p>
        בכל עמוד באתר, בפינה השמאלית-עליונה, יש כפתור עגול ירוק (סמל
        הגדרות) שפותח את <strong>תפריט הנגישות</strong>. בתפריט אפשר
        להפעיל ולכבות:
      </p>
      <ul>
        <li>
          <strong>הגדלת טקסט</strong> — מעבר בין רגיל / גדול (110%) / גדול
          מאוד (125%) / ענק (150%)
        </li>
        <li>
          <strong>ניגודיות גבוהה</strong> — שחור על לבן עם קישורים ציאן
        </li>
        <li>
          <strong>עצירת אנימציות</strong> — חיוני למשתמשים עם רגישות
          לאפילפסיה פוטוסנסיטיבית
        </li>
        <li>
          <strong>הדגשת קישורים</strong> — קו תחתון, מודגש ורקע צהוב לכל
          קישור
        </li>
        <li>
          <strong>סמן עכבר מוגדל</strong> — לאיתור קל יותר של מצביע העכבר
        </li>
        <li>
          <strong>איפוס הגדרות</strong> — חזרה למצב ברירת מחדל
        </li>
      </ul>
      <p>
        ההעדפות שלך נשמרות במכשיר שלך ונשארות בין ביקורים.
      </p>

      <h2>תאימות לקוראי מסך</h2>
      <p>
        האתר נבדק ונמצא תואם לתוכנות עזר נפוצות:
      </p>
      <ul>
        <li>NVDA (NonVisual Desktop Access)</li>
        <li>JAWS (Job Access With Speech)</li>
        <li>VoiceOver (iOS / macOS)</li>
        <li>TalkBack (Android)</li>
      </ul>

      <h2>נגישות נוספת</h2>
      <ul>
        <li>ניווט מלא במקלדת (Tab / Shift+Tab / Enter / Esc)</li>
        <li>תוויות ARIA וטקסטים חלופיים לכל התמונות</li>
        <li>היררכיית כותרות ברורה (H1 → H6)</li>
        <li>טפסים נגישים עם תוויות מקושרות</li>
        <li>צבעים בעלי ניגודיות העונה על תקן AA</li>
        <li>שטחי לחיצה מינימליים של 44×44 פיקסלים</li>
      </ul>

      <h2>חלקים שעלולים להיות לא נגישים</h2>
      <p>
        למרות מאמצינו להנגיש את כל חלקי האתר, ייתכן ויימצאו תכנים שטרם
        הונגשו במלואם. אנו פועלים באופן שוטף לאיתור ושיפור הנגישות.
      </p>

      <h2>פניות בנושא נגישות</h2>
      <p>
        אם נתקלת בבעיית נגישות באתר, או יש לך שאלה / הצעה לשיפור — אנא
        פנה אלינו, ונשתדל לטפל בפנייה תוך זמן סביר.
      </p>
      <ul>
        <li>
          מייל:{" "}
          <a href="mailto:accessibility@jerseydrop.co.il">
            accessibility@jerseydrop.co.il
          </a>
        </li>
        <li>
          טלפון / WhatsApp: <strong>053-393-6304</strong>
        </li>
        <li>
          טופס יצירת קשר: <a href="/contact">/contact</a>
        </li>
      </ul>

      <h2>רכז נגישות</h2>
      <p>
        אריאל מינדל —{" "}
        <a href="mailto:accessibility@jerseydrop.co.il">
          accessibility@jerseydrop.co.il
        </a>
      </p>
    </LegalPage>
  );
}
