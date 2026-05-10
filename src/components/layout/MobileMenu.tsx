"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, ChevronDown, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { LEAGUES, NATIONS } from "@/lib/constants";

export default function MobileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<"leagues" | "nations" | null>(null);
  const [query, setQuery] = useState("");

  const tier1 = NATIONS.filter((n) => n.tier === "tier-1");
  const tier2 = NATIONS.filter((n) => n.tier === "tier-2");

  const close = () => {
    setOpen(false);
    setSection(null);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    close();
    setQuery("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="תפריט"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex flex-col p-0 w-full !max-w-none border-s-0"
      >
        <SheetHeader>
          <SheetTitle>
            Jersey<span className="text-accent">Drop</span>
          </SheetTitle>
        </SheetHeader>
        {/* Search input — large, full-width, type=search → mobile keyboard
             shows the magnifying-glass enter key. Font-size 16px keeps iOS
             from auto-zooming the page on focus. */}
        <form onSubmit={submitSearch} className="border-b border-border px-4 py-3">
          <label className="relative block">
            <span className="sr-only">חיפוש</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute end-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              placeholder="חפש חולצה, מועדון, נבחרת..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block h-12 w-full rounded-full border border-border bg-background pe-12 ps-4 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </label>
        </form>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="flex flex-col gap-1">
            <li>
              <button
                type="button"
                onClick={() =>
                  setSection(section === "leagues" ? null : "leagues")
                }
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-start text-base font-semibold text-foreground transition-colors hover:bg-background"
              >
                ליגות
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${section === "leagues" ? "rotate-180" : ""}`}
                />
              </button>
              {section === "leagues" && (
                <ul className="mt-1 flex flex-col gap-0.5 ps-4">
                  {LEAGUES.map((league) => (
                    <li key={league.id}>
                      <SheetClose asChild>
                        <Link
                          href={`/leagues/${league.slug}`}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
                        >
                          <span>{league.nameHe}</span>
                          <span className="font-display text-xs text-muted/70">
                            {league.nameEn}
                          </span>
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                  <li>
                    <SheetClose asChild>
                      <Link
                        href="/#leagues"
                        className="flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-accent"
                      >
                        כל הליגות ←
                      </Link>
                    </SheetClose>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <button
                type="button"
                onClick={() =>
                  setSection(section === "nations" ? null : "nations")
                }
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-start text-base font-semibold text-foreground transition-colors hover:bg-background"
              >
                נבחרות
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${section === "nations" ? "rotate-180" : ""}`}
                />
              </button>
              {section === "nations" && (
                <ul className="mt-1 flex flex-col gap-0.5 ps-4">
                  <li className="mt-1 section-eyebrow ps-3">Tier 1</li>
                  {tier1.map((n) => (
                    <li key={n.slug}>
                      <SheetClose asChild>
                        <Link
                          href={`/nations/${n.slug}`}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
                        >
                          <span className="text-lg">{n.flag}</span>
                          {n.nameHe}
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                  <li className="mt-2 section-eyebrow !text-muted ps-3">
                    Tier 2
                  </li>
                  {tier2.map((n) => (
                    <li key={n.slug}>
                      <SheetClose asChild>
                        <Link
                          href={`/nations/${n.slug}`}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
                        >
                          <span className="text-lg">{n.flag}</span>
                          {n.nameHe}
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                  <li>
                    <SheetClose asChild>
                      <Link
                        href="/nations"
                        className="flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-accent"
                      >
                        כל הנבחרות ←
                      </Link>
                    </SheetClose>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <SheetClose asChild>
                <Link
                  href="/kids"
                  className="block rounded-xl px-4 py-3 text-base font-semibold text-pink-300 transition-colors hover:bg-background"
                  onClick={close}
                >
                  ילדים
                </Link>
              </SheetClose>
            </li>
            <li>
              <SheetClose asChild>
                <Link
                  href="/collections/special"
                  className="block rounded-xl px-4 py-3 text-base font-semibold text-amber transition-colors hover:bg-background"
                  onClick={close}
                >
                  מיוחדות
                </Link>
              </SheetClose>
            </li>
            <li>
              <SheetClose asChild>
                <Link
                  href="/retro"
                  className="block rounded-xl px-4 py-3 text-base font-semibold text-gold transition-colors hover:bg-background"
                  onClick={close}
                >
                  רטרו
                </Link>
              </SheetClose>
            </li>
            <li>
              <SheetClose asChild>
                <Link
                  href="/products"
                  className="block rounded-xl px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-background"
                  onClick={close}
                >
                  כל החולצות
                </Link>
              </SheetClose>
            </li>
            <li className="mt-6 border-t border-border/60 pt-4">
              <SheetClose asChild>
                <Link
                  href="/about"
                  className="block rounded-xl px-4 py-3 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
                >
                  עלינו
                </Link>
              </SheetClose>
            </li>
            <li>
              <SheetClose asChild>
                <Link
                  href="/contact"
                  className="block rounded-xl px-4 py-3 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
                >
                  צור קשר
                </Link>
              </SheetClose>
            </li>
            <li>
              <SheetClose asChild>
                <Link
                  href="/size-guide"
                  className="block rounded-xl px-4 py-3 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
                >
                  מדריך מידות
                </Link>
              </SheetClose>
            </li>
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
