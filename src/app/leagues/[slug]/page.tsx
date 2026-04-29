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
      <section className="border-b border-border/60 bg-background">
        <div className="container py-10 md:py-14">
          <nav className="mb-4 flex items-center gap-1 text-xs text-muted">
            <Link href="/leagues" className="inline-flex items-center gap-1 hover:text-foreground">
              <ChevronLeft className="h-3.5 w-3.5" />
              ליגות
            </Link>
          </nav>
          <span className="section-eyebrow">{league.nameEn}</span>
          <h1 className="mt-2 font-display text-4xl font-black uppercase leading-tight md:text-5xl">
            {league.nameHe}
          </h1>
          <p className="mt-2 text-sm text-muted md:text-base">
            {league.country} · {totalProducts} חולצות מ-{teams.length} קבוצות
          </p>
        </div>
      </section>

      {teams.length === 0 ? (
        <section className="container py-16">
          <div className="rounded-3xl border border-dashed border-border bg-surface/40 p-10 text-center">
            <p className="font-display text-lg font-bold uppercase tracking-tight">
              אין כרגע קבוצות זמינות בליגה הזו
            </p>
          </div>
        </section>
      ) : (
        <section className="container py-8 md:py-12">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {teams.map((t) => (
              <TeamCard
                key={t.slug}
                to={`/teams/${t.slug}`}
                slug={t.slug}
                name={t.name}
                productCount={t.productCount}
                image={t.heroImage}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
