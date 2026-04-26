import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { getProductsByTeam } from "@/lib/products";
import type { Product } from "@/lib/types";

const ISRAELI_TEAM_SLUGS = [
  "hapoel-tel-aviv",
  "maccabi-tel-aviv",
  "beitar-jerusalem",
  "hapoel",
  "maccabi",
];

function pickHero(slug: string): Product | undefined {
  const teamProducts = getProductsByTeam(slug);
  if (!teamProducts.length) return undefined;
  return (
    teamProducts.find((p) => p.type === "home" && !p.isRetro) ||
    teamProducts.find((p) => !p.isRetro) ||
    teamProducts[0]
  );
}

export default function IsraeliFaves() {
  const seen = new Set<string>();
  const products: Product[] = [];
  for (const slug of ISRAELI_TEAM_SLUGS) {
    const pick = pickHero(slug);
    if (pick && !seen.has(pick.id)) {
      products.push(pick);
      seen.add(pick.id);
      if (products.length >= 4) break;
    }
  }
  if (products.length === 0) return null;

  return (
    <section className="container py-12 md:py-16">
      <div className="relative overflow-hidden rounded-3xl border border-[#0038b8]/30 bg-[#0038b8]/5 p-6 md:p-10">
        <div
          aria-hidden
          className="absolute -top-24 end-1/4 h-72 w-72 rounded-full bg-[#0038b8]/15 blur-[140px]"
        />
        <div className="relative">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="section-eyebrow !text-[#7CB9FF]">
                Made in Israel
              </span>
              <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-tight md:text-4xl">
                <Star className="me-1 inline-block h-7 w-7 text-[#7CB9FF]" />
                מועדפים <span className="text-accent">בישראל</span>
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted md:text-base">
                החולצות של הליגה הישראלית — הפועל תל אביב, מכבי, ביתר ועוד.
              </p>
            </div>
            <Link
              href="/israeli"
              className="inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-widest text-[#7CB9FF] hover:underline"
            >
              כל החולצות הישראליות <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
