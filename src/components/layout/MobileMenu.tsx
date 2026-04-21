"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ChevronDown } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<"leagues" | "nations" | null>(null);

  const tier1 = NATIONS.filter((n) => n.tier === "tier-1");
  const tier2 = NATIONS.filter((n) => n.tier === "tier-2");

  const close = () => {
    setOpen(false);
    setSection(null);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="תפריט"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0">
        <SheetHeader>
          <SheetTitle>
            Jersey<span className="text-accent">Drop</span>
          </SheetTitle>
        </SheetHeader>
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
                        href="/leagues"
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
