"use client";

import Link from "next/link";
import { ArrowLeft, Flag, Shield, Trophy } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { LEAGUES, NATIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Counts = {
  byLeague: Record<string, number>;
  byTeamSlug: Record<string, number>;
  byTier: Record<string, number>;
};

export default function MegaMenu({ counts }: { counts?: Counts }) {
  const tier1 = NATIONS.filter((n) => n.tier === "tier-1");
  const tier2 = NATIONS.filter((n) => n.tier === "tier-2");
  const fmt = (n: number | undefined) =>
    typeof n === "number" && n > 0 ? ` (${n})` : "";

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        {/* LEAGUES */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>ליגות</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[640px] grid-cols-2 gap-4 p-6">
              <div className="col-span-2 mb-1 flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                <span className="section-eyebrow">ליגות מובילות</span>
              </div>
              {LEAGUES.map((league) => (
                <NavigationMenuLink key={league.id} asChild>
                  <Link
                    href={`/leagues/${league.slug}`}
                    className="group flex flex-col gap-1 rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-background"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-base font-bold uppercase tracking-tight text-foreground">
                        {league.nameHe}
                        <span className="ms-1 font-display text-xs text-accent">
                          {fmt(counts?.byLeague[league.slug])}
                        </span>
                      </span>
                      <span className="font-display text-xs text-muted">
                        {league.nameEn}
                      </span>
                    </div>
                    <span className="line-clamp-1 text-xs text-muted">
                      {league.teams.slice(0, 4).join(" · ")}
                    </span>
                  </Link>
                </NavigationMenuLink>
              ))}
              <NavigationMenuLink asChild>
                <Link
                  href="/leagues"
                  className="col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-accent/10 py-2 font-display text-xs font-bold uppercase tracking-widest text-accent transition-colors hover:bg-accent/20"
                >
                  כל הליגות <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* NATIONS */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>נבחרות</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[680px] grid-cols-2 gap-6 p-6">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-accent" />
                  <span className="section-eyebrow">
                    Tier 1 · Must-have{fmt(counts?.byTier["tier-1"])}
                  </span>
                </div>
                <ul className="flex flex-col gap-1">
                  {tier1.map((nation) => (
                    <li key={nation.slug}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={`/nations/${nation.slug}`}
                          className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-background"
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <span className="text-lg">{nation.flag}</span>
                            {nation.nameHe}
                            <span className="font-display text-[10px] text-accent">
                              {fmt(counts?.byTeamSlug[nation.slug])}
                            </span>
                          </span>
                          <span className="font-display text-xs text-muted">
                            {nation.nameEn}
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted" />
                  <span className="section-eyebrow !text-muted">
                    Tier 2 · Popular{fmt(counts?.byTier["tier-2"])}
                  </span>
                </div>
                <ul className="flex flex-col gap-1">
                  {tier2.map((nation) => (
                    <li key={nation.slug}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={`/nations/${nation.slug}`}
                          className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-background"
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <span className="text-lg">{nation.flag}</span>
                            {nation.nameHe}
                            <span className="font-display text-[10px] text-accent">
                              {fmt(counts?.byTeamSlug[nation.slug])}
                            </span>
                          </span>
                          <span className="font-display text-xs text-muted">
                            {nation.nameEn}
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </div>
              <NavigationMenuLink asChild>
                <Link
                  href="/nations"
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-accent/10 py-2 font-display text-xs font-bold uppercase tracking-widest text-accent transition-colors hover:bg-accent/20"
                >
                  כל הנבחרות + מונדיאל 2026 <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/kids"
              className={cn(
                navigationMenuTriggerStyle(),
                "gap-1 text-pink-300 hover:text-pink-300",
              )}
            >
              ילדים
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/collections/special"
              className={cn(
                navigationMenuTriggerStyle(),
                "gap-1 text-amber hover:text-amber",
              )}
            >
              מיוחדות
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/retro"
              className={cn(navigationMenuTriggerStyle(), "gap-1 text-gold hover:text-gold")}
            >
              רטרו
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/products" className={navigationMenuTriggerStyle()}>
              כל החולצות
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
