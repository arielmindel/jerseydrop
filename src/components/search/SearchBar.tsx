"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, X, Clock } from "lucide-react";

const RECENT_KEY = "jerseydrop:recent-searches";
const MAX_RECENT = 6;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  if (typeof window === "undefined") return;
  const trimmed = query.trim();
  if (!trimmed) return;
  const current = loadRecent();
  const next = [trimmed, ...current.filter((q) => q !== trimmed)].slice(
    0,
    MAX_RECENT,
  );
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore storage failure */
  }
}

export default function SearchBar({
  variant = "header",
}: {
  variant?: "header" | "page";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close + collapse on route change
  useEffect(() => {
    setOpen(false);
    setMobileExpanded(false);
  }, [pathname]);

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveRecent(trimmed);
    setOpen(false);
    setMobileExpanded(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(query);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearRecent = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(RECENT_KEY);
    }
    setRecent([]);
  };

  // Mobile: shows a search icon button that expands into a full-width
  // overlay input. Desktop: inline pill in the Header.
  if (variant === "header" && !mobileExpanded) {
    return (
      <div ref={wrapRef} className="relative flex items-center">
        <button
          type="button"
          onClick={() => {
            setMobileExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 30);
          }}
          aria-label="חיפוש"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>
        <form
          onSubmit={onSubmit}
          className="relative hidden items-center md:flex"
        >
          <Search className="pointer-events-none absolute end-3 h-4 w-4 text-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder="חפש חולצה, מועדון, נבחרת..."
            aria-label="חיפוש"
            className="h-10 w-64 rounded-full border border-border bg-surface ps-10 pe-4 text-sm text-foreground placeholder:text-muted focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40 lg:w-80"
            dir="rtl"
          />
        </form>
        {open && variant === "header" && (
          <SuggestionsDropdown
            query={query}
            recent={recent}
            onPick={submit}
            onClearRecent={clearRecent}
          />
        )}
      </div>
    );
  }

  // Mobile expanded overlay
  if (mobileExpanded) {
    return (
      <div
        ref={wrapRef}
        className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background p-3 shadow-2xl md:relative md:inset-auto md:p-0 md:shadow-none"
      >
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileExpanded(false)}
            aria-label="סגור חיפוש"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              ref={inputRef}
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={onKey}
              placeholder="חפש חולצה, מועדון, נבחרת..."
              aria-label="חיפוש"
              className="h-12 w-full rounded-full border border-border bg-surface ps-10 pe-4 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              dir="rtl"
            />
          </div>
        </form>
        {open && (
          <SuggestionsDropdown
            query={query}
            recent={recent}
            onPick={submit}
            onClearRecent={clearRecent}
            absolute={false}
          />
        )}
      </div>
    );
  }

  // /search page variant — wider, no dropdown
  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-2xl">
      <Search className="pointer-events-none absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חפש חולצה, מועדון, נבחרת..."
        aria-label="חיפוש"
        className="h-14 w-full rounded-full border border-border bg-surface ps-12 pe-6 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        dir="rtl"
      />
    </form>
  );
}

function SuggestionsDropdown({
  query,
  recent,
  onPick,
  onClearRecent,
  absolute = true,
}: {
  query: string;
  recent: string[];
  onPick: (q: string) => void;
  onClearRecent: () => void;
  absolute?: boolean;
}) {
  if (!recent.length && query.trim().length === 0) return null;
  return (
    <div
      className={
        absolute
          ? "absolute end-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl lg:w-80"
          : "mt-2 overflow-hidden rounded-2xl border border-border bg-surface"
      }
    >
      {recent.length > 0 && (
        <div className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-[10px] font-bold uppercase tracking-widest text-muted">
              חיפושים אחרונים
            </span>
            <button
              type="button"
              onClick={onClearRecent}
              className="text-[10px] text-muted hover:text-accent"
            >
              נקה
            </button>
          </div>
          <ul className="space-y-0.5">
            {recent.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => onPick(q)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-sm text-foreground transition-colors hover:bg-background"
                >
                  <Clock className="h-3.5 w-3.5 text-muted" />
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
