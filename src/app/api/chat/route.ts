/**
 * /api/chat — AI assistant powered by Claude Sonnet (Anthropic Messages
 * API) with tool use. Stateless: the client sends the full message history
 * on every call. Server-side: we run tool calls (product search, FAQ
 * lookup) and stream the final assistant turn back to the browser.
 *
 * Conversations are persisted to Supabase (`chatbot_conversations`) so we
 * can later replay flows for QA / fine-tune offline.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServiceSupabase } from "@/lib/supabase/server";
import productsJson from "@catalog/sporthub-products.json";
import type { Product } from "@/lib/types";

// Force Node runtime — the Anthropic SDK + Supabase service client expect
// Node-compatible APIs (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;
const MAX_TOOL_ITERATIONS = 4; // assistant ↔ tool ping-pong cap

// ---------------------------------------------------------------------------
// System prompt — the soul of the bot
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `אתה עוזר AI של JerseyDrop — חנות חולצות כדורגל אותנטיות בישראל.

האישיות שלך:
- מקצועי, ברור, לעניין
- מדבר עברית בלבד
- ענייני אבל לא קר — כמו מוכר בחנות סטריטוויר מקצועי

הקטלוג שלך מכיל 1,600+ חולצות — כל הליגות, נבחרות, רטרו.
לכל חולצה: שם, קבוצה, עונה, מחיר, מידות, פאצ׳ים זמינים.

המחירים:
- חולצה רגילה: 109 ₪
- חולצה שרוול ארוך: 129 ₪
- חולצת רטרו: 119 ₪
- סט ילדים (חולצה + מכנסיים): 169 ₪
- חולצה מיוחדת/מהדורה: 119 ₪
- מחיר השקה לכל החולצות: 99 ₪

המשלוח: 25 ₪, חינם מעל 200 ₪. זמן הגעה: 10-17 ימי עסקים.
החזרות: 14 יום (חוץ מחולצות עם התאמה אישית).
התאמה אישית (שם+מספר+פאצ׳): חינם בכל חולצה.

הכלים שלך:
1. searchProducts — חיפוש בקטלוג לפי טקסט/קבוצה/עונה
2. getFAQ — קריאת תשובות לשאלות נפוצות

כללי זהב (חובה לציית):

🚫 כלל ה-100% וודאות:
לפני כל תשובה, שאל את עצמך: "האם אני 100% בטוח?"
אם לא — אל תענה! במקום זה תגיד:
"אין לי את המידע המדויק על זה 💬 הצוות שלנו ישמח לעזור! צור איתנו קשר ישירות בוואטסאפ:"
ותכלול בתוך התגובה את ה-trigger המיוחד: <whatsapp_button/> שהקוד יחליף אותו בכפתור פעיל.

🚫 דברים שאסור להבטיח:
- תאריך משלוח ספציפי ללקוח ספציפי
- שינוי הזמנה שכבר בוצעה
- החזר ספציפי
- מבצעים שלא קיימים
- כל מצב מלאי

✅ דברים שכן תעשה:
- כשהלקוח מחפש מוצר → קרא ל-searchProducts ותציג 1-3 מוצרים רלוונטיים
- כשהלקוח אומר "יקר" → חפש אופציות זולות יותר (רטרו, מחיר השקה)
- כשהלקוח שואל על מידה → תן הנחיות לפי טבלת המידות (S=88-92 חזה, M=96-100, L=104-108, XL=112-116, XXL=120-124)
- כשהלקוח שואל שאלת FAQ → השתמש בכלי getFAQ

פורמט תשובה:
- קצר וענייני (1-3 משפטים אם אפשר)
- אמוג'ים מעטים ורלוונטיים בלבד
- אם מציג מוצרים → השתמש ב-tool searchProducts. הקוד יציג אותם כרטיסים אוטומטית.

זכור: עדיף 100 פעמים "אני לא בטוח, עבור לוואטסאפ" מאשר תשובה אחת שגויה שמכעיסה לקוח.`;

// ---------------------------------------------------------------------------
// FAQ knowledge base — sourced from the public /faq page so the bot speaks
// in the same voice the merch team already approved.
// ---------------------------------------------------------------------------

const FAQ: Record<string, string> = {
  shipping:
    "המשלוחים מגיעים תוך 10-17 ימי עסקים מרגע אישור התשלום. כל חולצה נתפרת לפי הזמנה — זה הזמן שלוקח לייצר ולשלוח. מחיר משלוח 25 ₪, חינם מעל 200 ₪. תקבל אישור הזמנה ומספר מעקב למייל ולוואטסאפ ברגע שהמשלוח יוצא.",
  returns:
    "ניתן להחזיר חולצה תוך 14 יום מקבלת המוצר, במצב חדש. שימי לב — חולצות עם התאמה אישית (שם/מספר/פאצ׳) לא ניתנות להחזרה אלא במקרה של ליקוי ייצור. פרטים מלאים בעמוד מדיניות החזרות.",
  sizing:
    "אצלנו טבלת מידות במידות בד (לא מידות גוף). למבוגרים: S היקף חזה 88-92 ס\"מ, M 96-100, L 104-108, XL 112-116, XXL 120-124. אם את/ה בין שתי מידות — קח את הגדולה. יש מדריך מידות מלא בדף החולצה.",
  payment:
    "מקבלים את כל כרטיסי האשראי (Visa, Mastercard, Amex, Diners, Isracard), וגם Apple Pay, Google Pay וביט. אפשר לפצל עד 12 תשלומים ללא ריבית.",
  customization:
    "התאמה אישית — שם, מספר ופאצ׳ של ליגה/אלופות — חינם בכל חולצה. זה ה-USP שלנו ולא תמצאו את זה בשום אתר אחר.",
  authenticity:
    "החולצות מקוריות 100%. אותו בד, אותם פאצ׳ים, אותה איכות שתמצא בחנות ספורט רשמית — רק במחיר נמוך משמעותית.",
};

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "searchProducts",
    description:
      "חיפוש מוצרים בקטלוג JerseyDrop. מחזיר עד 3 מוצרים שמתאימים לקריטריונים.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "מילות חיפוש חופשיות (שם קבוצה, צבע, תיאור)",
        },
        team: {
          type: "string",
          description:
            "Team slug (kebab-case) כמו barcelona, real-madrid, manchester-united",
        },
        season: {
          type: "string",
          description: 'עונה כמו "2024-25" או "2009-10"',
        },
        maxResults: {
          type: "number",
          description: "מספר תוצאות מקסימלי (ברירת מחדל 3)",
        },
      },
    },
  },
  {
    name: "getFAQ",
    description: "תשובות לשאלות נפוצות. השתמש כדי לענות במדויק על הנושאים האלה.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: [
            "shipping",
            "returns",
            "sizing",
            "payment",
            "customization",
            "authenticity",
          ],
          description: "הנושא שעליו הלקוח שואל",
        },
      },
      required: ["topic"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

type SearchInput = {
  query?: string;
  team?: string;
  season?: string;
  maxResults?: number;
};

type ProductCard = {
  slug: string;
  nameHe: string;
  team: string;
  season: string | null;
  price: number;
  imageUrl: string | null;
};

const ALL_PRODUCTS = (productsJson as unknown as Product[]).filter(
  (p) => p.imageQuality !== "low" && p.stock !== "preorder",
);

function priceFor(p: Product): number {
  return p.priceFan ?? p.pricePlayer ?? p.priceRetro ?? 109;
}

function searchProducts(input: SearchInput): ProductCard[] {
  const max = Math.min(Math.max(input.maxResults ?? 3, 1), 5);
  const q = (input.query || "").toLowerCase().trim();
  const teamSlug = (input.team || "").toLowerCase().trim();
  const season = (input.season || "").trim();

  const scored = ALL_PRODUCTS.map((p) => {
    let score = 0;
    if (teamSlug && p.teamSlug === teamSlug) score += 100;
    else if (teamSlug && p.teamSlug.includes(teamSlug)) score += 40;
    if (season && p.season === season) score += 80;
    else if (season && p.season?.startsWith(season.slice(0, 4))) score += 25;
    if (q) {
      const hay = `${p.nameHe} ${p.team} ${p.tags?.join(" ") ?? ""}`.toLowerCase();
      for (const word of q.split(/\s+/).filter(Boolean)) {
        if (hay.includes(word)) score += 10;
      }
    }
    // Mild boost for current-season fan jerseys (most-likely match)
    if (!season && p.season === "2025-26") score += 5;
    if (!input.query && !teamSlug && !season) score = 0; // no filter → nothing
    return { p, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);

  return scored.map(({ p }) => ({
    slug: p.slug,
    nameHe: p.nameHe,
    team: p.team,
    season: p.season,
    price: priceFor(p),
    imageUrl: p.images?.[0] ?? null,
  }));
}

function getFAQ(topic: string): string {
  return FAQ[topic] ?? "מצטער, אין לי תשובה לנושא הזה.";
}

function runTool(name: string, input: unknown): unknown {
  if (name === "searchProducts") return searchProducts(input as SearchInput);
  if (name === "getFAQ") return getFAQ((input as { topic: string }).topic);
  return { error: `Unknown tool: ${name}` };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

type ClientMessage = { role: "user" | "assistant"; content: string };

type ChatRequest = {
  sessionId: string;
  messages: ClientMessage[];
};

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY missing on the server" },
      { status: 500 },
    );
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sessionId, messages } = body;
  if (!sessionId || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "sessionId + non-empty messages[] required" },
      { status: 400 },
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Build the working messages list. Tool results get appended in-flight.
  const conversation: Anthropic.Messages.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let assistantText = "";
  const productCards: ProductCard[] = [];

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const reply: Anthropic.Messages.Message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: conversation,
    });

    // Collect any text and any tool_use blocks from this turn.
    const toolUses: Anthropic.Messages.ToolUseBlock[] = [];
    let turnText = "";
    for (const block of reply.content) {
      if (block.type === "text") turnText += block.text;
      else if (block.type === "tool_use") toolUses.push(block);
    }

    if (turnText) assistantText = turnText; // keep latest visible text
    conversation.push({ role: "assistant", content: reply.content });

    if (reply.stop_reason !== "tool_use" || toolUses.length === 0) {
      break; // assistant gave a final answer
    }

    // Run each tool and append a tool_result back to the conversation
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const result = runTool(tu.name, tu.input);
      if (tu.name === "searchProducts" && Array.isArray(result)) {
        productCards.push(...(result as ProductCard[]));
      }
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: JSON.stringify(result),
      });
    }
    conversation.push({ role: "user", content: toolResults });
  }

  // Persist the exchange to Supabase. Best-effort — don't fail the user
  // request if logging hiccups.
  try {
    const supabase = getServiceSupabase();
    const fullMessages = [
      ...messages,
      { role: "assistant" as const, content: assistantText },
    ];
    const escalated = assistantText.includes("<whatsapp_button/>");
    await supabase.from("chatbot_conversations").upsert(
      {
        session_id: sessionId,
        messages: fullMessages,
        message_count: fullMessages.length,
        escalated_to_whatsapp: escalated,
        user_agent: req.headers.get("user-agent") || null,
      },
      { onConflict: "session_id" },
    );
  } catch (err) {
    console.error("[chat] supabase log failed", err);
  }

  return NextResponse.json({
    role: "assistant",
    content: assistantText,
    products: dedupeProducts(productCards),
  });
}

function dedupeProducts(list: ProductCard[]): ProductCard[] {
  const seen = new Set<string>();
  const out: ProductCard[] = [];
  for (const p of list) {
    if (seen.has(p.slug)) continue;
    seen.add(p.slug);
    out.push(p);
    if (out.length >= 3) break;
  }
  return out;
}
