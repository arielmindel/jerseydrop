import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { searchProducts, SEARCH_SUGGESTIONS } from "@/lib/search";
import InfiniteProductGrid from "@/components/product/InfiniteProductGrid";
import SearchBar from "@/components/search/SearchBar";

type Props = {
  searchParams: { q?: string };
};

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = searchParams.q?.trim();
  return {
    title: q ? `תוצאות חיפוש: ${q}` : "חיפוש",
    description: "חיפוש בכל קטלוג JerseyDrop — לפי קבוצה, ליגה, נבחרת ועוד.",
    robots: { index: false, follow: true },
  };
}

export default function SearchPage({ searchParams }: Props) {
  const q = (searchParams.q || "").trim();
  const results = q ? searchProducts(q, 200) : [];
  const products = results.map((r) => r.product);

  return (
    <>
      <section className="border-b border-border/60 bg-background">
        <div className="container py-10 md:py-14">
          <div className="flex items-center gap-2 text-muted">
            <SearchIcon className="h-4 w-4 text-accent" />
            <span className="section-eyebrow">Search</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-black uppercase leading-tight md:text-4xl">
            {q ? (
              <>
                תוצאות עבור{" "}
                <span className="text-accent">&ldquo;{q}&rdquo;</span>
              </>
            ) : (
              "מה אתם מחפשים?"
            )}
          </h1>
          {q && (
            <p className="mt-2 text-sm text-muted md:text-base">
              נמצאו {products.length} חולצות
            </p>
          )}
          <div className="mt-6 max-w-2xl">
            <SearchBar variant="page" />
          </div>
        </div>
      </section>

      <section className="container py-8 md:py-12">
        {!q ? (
          <SuggestionsBlock />
        ) : products.length > 0 ? (
          <InfiniteProductGrid products={products} />
        ) : (
          <EmptyState query={q} />
        )}
      </section>
    </>
  );
}

function SuggestionsBlock() {
  return (
    <div className="space-y-3 text-center">
      <p className="text-sm text-muted">
        התחילו להקליד למעלה, או בחרו מאחת ההצעות:
      </p>
      <ul className="mx-auto flex max-w-2xl flex-wrap justify-center gap-2">
        {SEARCH_SUGGESTIONS.map((s) => (
          <li key={s}>
            <Link
              href={`/search?q=${encodeURIComponent(s)}`}
              className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              {s}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface">
        <SearchIcon className="h-7 w-7 text-muted" />
      </div>
      <h2 className="font-display text-xl font-bold uppercase tracking-tight">
        לא נמצאו תוצאות עבור &ldquo;{query}&rdquo;
      </h2>
      <p className="text-sm text-muted">
        נסו לחפש קבוצה גדולה, ליגה, או נבחרת:
      </p>
      <ul className="flex flex-wrap justify-center gap-2">
        {SEARCH_SUGGESTIONS.slice(0, 6).map((s) => (
          <li key={s}>
            <Link
              href={`/search?q=${encodeURIComponent(s)}`}
              className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              {s}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
