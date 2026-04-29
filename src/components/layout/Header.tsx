import Image from "next/image";
import Link from "next/link";
import { Home } from "lucide-react";
import MegaMenu from "./MegaMenu";
import MobileMenu from "./MobileMenu";
import CartDrawer from "@/components/cart/CartDrawer";
import SearchBar from "@/components/search/SearchBar";
import { getAllProducts } from "@/lib/products";
import { getTopTeams } from "@/lib/teams";
import { LEAGUES } from "@/lib/constants";

/** Computed once per request — passed to the client MegaMenu so each
 *  league/tier/team chip can render with its product count. */
function buildNavCounts() {
  const products = getAllProducts();
  const byLeague: Record<string, number> = {};
  const byTeamSlug: Record<string, number> = {};
  const byTier: Record<string, number> = {};
  for (const p of products) {
    if (p.league) byLeague[p.league] = (byLeague[p.league] || 0) + 1;
    if (p.teamSlug) byTeamSlug[p.teamSlug] = (byTeamSlug[p.teamSlug] || 0) + 1;
    if (p.category === "national" && p.league?.startsWith("tier-")) {
      byTier[p.league] = (byTier[p.league] || 0) + 1;
    }
  }
  return { byLeague, byTeamSlug, byTier };
}

/** Top-5 teams per league for the mega-menu quick links. */
function buildTopTeams() {
  const out: Record<string, { slug: string; name: string }[]> = {};
  for (const l of LEAGUES) {
    out[l.slug] = getTopTeams(l.slug, 5).map((t) => ({
      slug: t.slug,
      name: t.name,
    }));
  }
  return out;
}

export default function Header() {
  const counts = buildNavCounts();
  const topTeamsByLeague = buildTopTeams();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center transition-transform hover:scale-[1.02]"
            aria-label="JerseyDrop — דף הבית"
          >
            <Image
              src="/logo/logo-256.png"
              alt="JerseyDrop"
              width={256}
              height={256}
              priority
              className="h-14 w-auto md:h-16"
            />
          </Link>
          <MegaMenu counts={counts} topTeamsByLeague={topTeamsByLeague} />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            aria-label="חזרה לעמוד הבית"
            title="עמוד הבית"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-accent"
          >
            <Home className="h-5 w-5" />
          </Link>
          <SearchBar variant="header" />
          <CartDrawer />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
