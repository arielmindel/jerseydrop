"use client";

/**
 * AI chatbot widget (Claude Sonnet 4.6). Floats bottom-left in RTL —
 * intentionally opposite the existing WhatsApp button (bottom-right) so the
 * two pulsing CTAs don't fight. Auto-hides while the Hero is in viewport so
 * the homepage opens clean. Click → expanding panel with chat history,
 * product cards, FAQ answers, and a WhatsApp escalation button whenever the
 * model isn't 100% sure.
 *
 * State model:
 *   - sessionId: uuid generated once per browser session, persists in
 *     sessionStorage so a refresh keeps the same Supabase row.
 *   - messages: full transcript, also in sessionStorage so the panel
 *     restores instantly on reopen.
 *
 * The chat is intentionally short-lived (sessionStorage, not localStorage):
 * customers don't expect bot context to survive across browser sessions
 * and we'd rather not surprise them with leftover conversations days later.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageCircle,
  X,
  RotateCcw,
  Send,
  Loader2,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";

// ---------------------------------------------------------------------------
// Types — mirror /api/chat
// ---------------------------------------------------------------------------

type Role = "user" | "assistant";

type ProductCard = {
  slug: string;
  nameHe: string;
  team: string;
  season: string | null;
  price: number;
  imageUrl: string | null;
};

type ChatMessage = {
  role: Role;
  content: string;
  products?: ProductCard[];
  id: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_KEY = "jd:chatbot:session";
const HISTORY_KEY = "jd:chatbot:history";
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "972533936304";
const WA_TRIGGER = "<whatsapp_button/>";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "היי! 👋 אני העוזר של JerseyDrop.\n" +
    "אני יכול לעזור לך למצוא חולצה, להמליץ על מידה, או לענות על שאלות.\n" +
    "איך אוכל לעזור?",
};

const SUGGESTED: string[] = [
  "מצא לי חולצת ברצלונה 2024",
  "איך אני מודד מידה?",
  "מה זמן המשלוח?",
];

// Hide the FAB on pages where it would be intrusive.
const HIDDEN_PATHS = ["/checkout", "/admin"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Chatbot() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [overHero, setOverHero] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const sessionIdRef = useRef<string>("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore session + history on mount.
  useEffect(() => {
    setMounted(true);
    try {
      let sid = window.sessionStorage.getItem(SESSION_KEY);
      if (!sid) {
        sid = crypto.randomUUID();
        window.sessionStorage.setItem(SESSION_KEY, sid);
      }
      sessionIdRef.current = sid;
      const raw = window.sessionStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed: ChatMessage[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {
      // private mode / no storage — fine
    }
  }, []);

  // Persist history on every change.
  useEffect(() => {
    if (!mounted) return;
    try {
      window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages, mounted]);

  // Auto-scroll to bottom when new messages arrive or panel opens.
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      if (listRef.current)
        listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, [messages, open]);

  // Hide the FAB while the Hero is on screen (homepage clean look).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hero = document.querySelector("[data-chatbot-hide]");
    if (!hero) {
      setOverHero(false);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => setOverHero(entry.isIntersecting),
      { threshold: 0.2 },
    );
    obs.observe(hero);
    return () => obs.disconnect();
  }, [pathname]);

  // Esc closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [open]);

  const reset = useCallback(() => {
    setMessages([WELCOME]);
    try {
      const sid = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, sid);
      sessionIdRef.current = sid;
      window.sessionStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const send = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
      if (!text || sending) return;
      setInput("");
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };
      const nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setSending(true);
      try {
        // Strip the welcome ID — server doesn't care about local-only seeds.
        const payload = nextHistory
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }));
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            messages: payload,
          }),
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data: {
          role: "assistant";
          content: string;
          products?: ProductCard[];
        } = await res.json();
        const reply: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.content || "מצטער, לא הצלחתי לענות.",
          products: data.products && data.products.length > 0 ? data.products : undefined,
        };
        setMessages((prev) => [...prev, reply]);
      } catch (err) {
        console.error("[chatbot] send failed", err);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "אופס, משהו נתקע אצלי 💬 נסה שוב בעוד רגע, או דבר איתנו ישירות בוואטסאפ. " +
              WA_TRIGGER,
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [input, sending, messages],
  );

  if (!mounted) return null;
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;
  const lastUserQuestion =
    [...messages].reverse().find((m) => m.role === "user")?.content || "";

  return (
    <>
      {/* Floating action button */}
      <button
        type="button"
        aria-label="פתח צ׳אט עם עוזר AI"
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 end-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#00FF88] text-black shadow-[0_8px_32px_rgba(0,255,136,0.45)] transition-all duration-300 ease-emphasized hover:scale-105 hover:shadow-[0_12px_42px_rgba(0,255,136,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-offset-2 focus-visible:ring-offset-background md:h-16 md:w-16 ${
          overHero || open
            ? "pointer-events-none translate-y-3 opacity-0"
            : "pointer-events-auto translate-y-0 opacity-100"
        }`}
        style={{ animation: open ? undefined : "jd-bot-pulse 4s ease-in-out infinite" }}
      >
        <MessageCircle className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.5} />
        {/* Subtle "AI" badge top-right of the button */}
        <span className="absolute -end-1 -top-1 inline-flex h-5 items-center gap-0.5 rounded-full bg-black px-1.5 font-display text-[9px] font-black uppercase tracking-widest text-[#00FF88] ring-2 ring-[#00FF88]">
          <Sparkles className="h-2.5 w-2.5" /> AI
        </span>
      </button>

      {/* Backdrop + Panel */}
      {open && (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:bg-black/40"
            style={{ animation: "jd-bot-fade 200ms ease-out" }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="צ׳אט עם עוזר AI של JerseyDrop"
            className="fixed inset-0 z-50 flex flex-col border border-white/10 bg-black/95 text-white shadow-[0_20px_80px_rgba(0,255,136,0.12)] backdrop-blur-2xl md:bottom-24 md:end-6 md:start-auto md:top-auto md:h-[640px] md:max-h-[calc(100vh-9rem)] md:w-[420px] md:rounded-3xl md:inset-y-auto md:inset-x-auto"
            style={{ animation: "jd-bot-panel-in 240ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          >
            <Header onClose={() => setOpen(false)} onReset={reset} />
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-4 py-4"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.15) transparent",
              }}
            >
              <div className="flex flex-col gap-3">
                {messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    lastUserQuestion={lastUserQuestion}
                  />
                ))}
                {messages.length === 1 && (
                  <SuggestedChips onPick={(t) => send(t)} />
                )}
                {sending && <TypingIndicator />}
              </div>
            </div>
            <Footer
              input={input}
              setInput={setInput}
              onSend={() => send()}
              disabled={sending}
              inputRef={inputRef}
            />
          </div>
        </>
      )}

      {/* Keyframes — colocated so the component is fully self-contained */}
      <style>{`
        @keyframes jd-bot-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(0,255,136,0.45); }
          50%      { transform: scale(1.05); box-shadow: 0 12px 42px rgba(0,255,136,0.65); }
        }
        @keyframes jd-bot-fade {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes jd-bot-panel-in {
          0%   { opacity: 0; transform: translateY(16px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes jd-bot-dot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.45; }
          40%           { transform: scale(1);   opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="jd-bot-pulse"], [style*="jd-bot-fade"], [style*="jd-bot-panel-in"] {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Header({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  return (
    <div className="relative flex items-center gap-3 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent px-4 py-3">
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#00FF88]/15 ring-1 ring-[#00FF88]/40">
        <Image
          src="/logo/logo-mark.png"
          alt="JerseyDrop"
          fill
          sizes="36px"
          className="object-contain p-1"
        />
        <span className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full bg-[#00FF88] ring-2 ring-black" />
      </div>
      <div className="flex flex-1 flex-col leading-tight">
        <span className="font-display text-sm font-black uppercase tracking-tight">
          עוזר JerseyDrop
        </span>
        <span className="font-display text-[10px] uppercase tracking-widest text-white/55">
          <span className="text-[#00FF88]">●</span> AI · עונה תוך שניות
        </span>
      </div>
      <button
        type="button"
        onClick={onReset}
        aria-label="התחל שיחה חדשה"
        className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/5 hover:text-white"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="סגור צ׳אט"
        className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/5 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function MessageBubble({
  message,
  lastUserQuestion,
}: {
  message: ChatMessage;
  lastUserQuestion: string;
}) {
  const isUser = message.role === "user";
  const segments = useMemo(
    () => splitWhatsAppTrigger(message.content),
    [message.content],
  );

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-bl-md bg-[#00FF88]/12 text-white"
            : "rounded-br-md bg-white/[0.06] text-white/95"
        }`}
      >
        {segments.map((seg, i) =>
          seg.type === "text" ? (
            <p key={i} className="whitespace-pre-wrap">
              {seg.value}
            </p>
          ) : (
            <WhatsAppEscalateButton
              key={i}
              question={lastUserQuestion}
            />
          ),
        )}
        {message.products && message.products.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {message.products.map((p) => (
              <InlineProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InlineProductCard({ product }: { product: ProductCard }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-2 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-3 transition-all duration-200 hover:border-[#00FF88]/50 hover:bg-black/60 hover:shadow-[0_8px_32px_rgba(0,255,136,0.15)]"
    >
      {product.imageUrl && (
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-white/5">
          <Image
            src={product.imageUrl}
            alt={product.nameHe}
            fill
            sizes="320px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            unoptimized
          />
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <h4 className="font-display text-sm font-bold uppercase tracking-tight text-white">
          {product.nameHe}
        </h4>
        <p className="font-display text-[10px] uppercase tracking-widest text-white/55">
          {product.team}
          {product.season ? ` · ${product.season}` : ""}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-black text-[#00FF88]">
          {product.price} ₪
        </span>
        <span className="rounded-full bg-[#00FF88] px-3 py-1 font-display text-[11px] font-black uppercase tracking-widest text-black transition-transform duration-200 group-hover:scale-[1.04]">
          קנה עכשיו ←
        </span>
      </div>
    </Link>
  );
}

function WhatsAppEscalateButton({ question }: { question: string }) {
  const text = encodeURIComponent(
    `שלום, הופניתי מהצ'אטבוט באתר. השאלה שלי: ${question || "(לא צוין)"}`,
  );
  return (
    <a
      href={`https://wa.me/${WA_NUMBER}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white transition-transform duration-200 hover:scale-[1.03]"
    >
      <svg
        className="h-4 w-4 fill-white"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.27-4.39c0-4.55 3.7-8.25 8.26-8.25 4.54 0 8.24 3.7 8.24 8.25 0 4.54-3.7 8.25-8.24 8.25z" />
      </svg>
      📲 שלח הודעה בוואטסאפ
    </a>
  );
}

function SuggestedChips({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {SUGGESTED.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/85 transition-all duration-200 hover:border-[#00FF88]/50 hover:bg-[#00FF88]/10 hover:text-white"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-br-md bg-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 0.15, 0.3].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 rounded-full bg-[#00FF88]"
              style={{
                animation: `jd-bot-dot 1.2s ease-in-out ${delay}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Footer({
  input,
  setInput,
  onSend,
  disabled,
  inputRef,
}: {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}) {
  return (
    <div className="border-t border-white/10 bg-gradient-to-t from-white/[0.03] to-transparent px-4 pb-4 pt-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="flex items-end gap-2"
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Auto-resize up to ~4 lines
            const el = e.target;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 96) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="שאל אותי כל דבר..."
          aria-label="הקלד שאלה"
          disabled={disabled}
          className="max-h-24 flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#00FF88]/50 focus:outline-none focus:ring-1 focus:ring-[#00FF88]/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          aria-label="שלח"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00FF88] text-black shadow-[0_6px_20px_rgba(0,255,136,0.35)] transition-all duration-200 hover:scale-105 hover:shadow-[0_8px_28px_rgba(0,255,136,0.5)] disabled:opacity-40 disabled:hover:scale-100"
        >
          {disabled ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" strokeWidth={2.5} />
          )}
        </button>
      </form>
      <p className="mt-2 text-center text-[10px] text-white/40">
        AI · עלול לטעות לעיתים · לחירום עבור לוואטסאפ
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Segment =
  | { type: "text"; value: string }
  | { type: "whatsapp" };

function splitWhatsAppTrigger(content: string): Segment[] {
  if (!content.includes(WA_TRIGGER)) return [{ type: "text", value: content }];
  const segs: Segment[] = [];
  const parts = content.split(WA_TRIGGER);
  parts.forEach((p, i) => {
    if (p) segs.push({ type: "text", value: p });
    if (i < parts.length - 1) segs.push({ type: "whatsapp" });
  });
  return segs;
}
