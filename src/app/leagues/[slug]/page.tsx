import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { LEAGUES } from "@/lib/constants";
import { getTeamsInScope } from "@/lib/teams";
import TeamCard from "@/components/team/TeamCard";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return LEAGUES.map((l) => ({ slug: l.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const league = LEAGUES.find((l) => l.slug === params.slug);
  if (!league) return { title: "ליגה לא נמצאה" };
  return {
    alternates: { canonical: `/leagues/${params.slug}` },
    title: `${league.nameHe} · ${league.nameEn} — קבוצות וחולצות`,
    description: `כל קבוצות ${league.nameHe}. בחרו קבוצה וגלו את כל החולצות שלה — בית, חוץ, רטרו ועוד.`,
  };
}

export default function LeaguePage({ params }: Props) {
  const league = LEAGUES.find((l) => l.slug === params.slug);
  if (!league) notFound();

  const teams = getTeamsInScope(league.slug);
  const totalProducts = teams.reduce((sum, t) => sum + t.productCount, 0);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60 bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 start-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/10 blur-[140px]"
        />
        <div className="container relative section-y-tight">
          <nav className="mb-4 flex items-center gap-1 text-caption text-muted">
            <Link
              href="/#leagues"
              className="inline-flex items-center gap-1 transition-colors duration-base hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              ליגות
            </Link>
          </nav>
          <span className="section-eyebrow">{league.nameEn}</span>
          <h1 className="mt-3 font-display text-display-lg font-black uppercase leading-tight">
            {league.nameHe}
          </h1>
          <p className="mt-3 text-body text-muted">
            {league.country} · {totalProducts} חולצות מ-{teams.length} קבוצות
          </p>
        </div>
      </section>

      {teams.length === 0 ? (
        <section className="container py-16">
          <div className="rounded-3xl border border-dashed border-border bg-surface/40 p-10 text-center">
            <p className="font-display text-h2 font-bold uppercase tracking-tight">
              אין כרגע קבוצות זמינות בליגה הזו
            </p>
            <p className="mt-2 text-body-sm text-muted">
              חזרו בקרוב — אנחנו מוסיפים קבוצות וחולצות כל הזמן.
            </p>
          </div>
        </section>
      ) : (
        <section className="container py-8 md:py-12">
          <div className="reveal-grid grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {teams.map((t) => (
              <div key={t.slug} className="reveal-item">
                <TeamCard
                  to={`/teams/${t.slug}`}
                  slug={t.slug}
                  name={t.name}
                  productCount={t.productCount}
                  image={t.heroImage}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
