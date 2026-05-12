import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import { allProductsIncludingHidden } from "@/lib/products";
import AdminHeader from "../AdminHeader";

export const metadata = {
  title: "חולצות מוסתרות | פאנל ניהול",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function HiddenProductsPage() {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const hidden = allProductsIncludingHidden.filter(
    (p) => p.imageQuality === "low",
  );

  // Group by team for easier scanning when ordering inventory.
  const byTeam = new Map<string, typeof hidden>();
  for (const p of hidden) {
    const key = p.team || p.teamSlug || "?";
    if (!byTeam.has(key)) byTeam.set(key, []);
    byTeam.get(key)!.push(p);
  }
  const groups = Array.from(byTeam.entries()).sort(
    (a, b) => b[1].length - a[1].length,
  );

  return (
    <>
      <AdminHeader email={user.email || ""} />
      <main className="container py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/admin"
              className="mb-2 inline-flex items-center gap-1 text-caption text-muted transition-colors hover:text-foreground"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              חזרה לפאנל
            </Link>
            <h1 className="font-display text-display-md font-black uppercase">
              חולצות שמחכות לצילום
            </h1>
            <p className="mt-2 text-body text-muted">
              {hidden.length} חולצות מוסתרות מהאתר עד שיהיו תמונות איכותיות.
              <br />
              סיבה: כל התמונות מהספק הן קלוז-אפים של בד / תוויות / סמלים — לא חולצה
              מלאה. שלוף מלאי, צלם חזית + גב, ושלח את התמונות החדשות לעדכון.
            </p>
          </div>
          <div className="rounded-2xl border border-accent/40 bg-accent/10 px-5 py-3 text-center">
            <p className="font-display text-display-md font-black text-accent">
              {hidden.length}
            </p>
            <p className="font-display text-[10px] uppercase tracking-widest text-muted">
              SKUs מחכות
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {groups.map(([team, items]) => (
            <section key={team}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-display text-h2 font-bold uppercase">
                  {team}
                </h2>
                <span className="font-display text-caption uppercase tracking-widest text-muted">
                  {items.length} חולצות
                </span>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-surface/50">
                    <tr className="text-right">
                      <th className="px-3 py-2 font-display text-[10px] uppercase tracking-widest text-muted">
                        תמונה (נוכחית)
                      </th>
                      <th className="px-3 py-2 font-display text-[10px] uppercase tracking-widest text-muted">
                        שם החולצה
                      </th>
                      <th className="px-3 py-2 font-display text-[10px] uppercase tracking-widest text-muted">
                        עונה
                      </th>
                      <th className="px-3 py-2 font-display text-[10px] uppercase tracking-widest text-muted">
                        סוג
                      </th>
                      <th className="px-3 py-2 font-display text-[10px] uppercase tracking-widest text-muted">
                        slug
                      </th>
                      <th className="px-3 py-2 font-display text-[10px] uppercase tracking-widest text-muted">
                        sourceHandleCn
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-border/60 hover:bg-surface/30"
                      >
                        <td className="px-3 py-2">
                          {p.images?.[0] ? (
                            <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                              <Image
                                src={p.images[0]}
                                alt={p.nameHe}
                                fill
                                sizes="64px"
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-[9px] text-muted">
                              אין תמונה
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-foreground">{p.nameHe}</td>
                        <td className="px-3 py-2 text-muted">{p.season || "—"}</td>
                        <td className="px-3 py-2 text-muted">{p.type}</td>
                        <td
                          className="max-w-[220px] truncate px-3 py-2 font-mono text-[11px] text-muted"
                          title={p.slug}
                        >
                          {p.slug}
                        </td>
                        <td
                          className="max-w-[180px] truncate px-3 py-2 font-mono text-[11px] text-muted"
                          title={p.sourceHandleCn || ""}
                        >
                          {p.sourceHandleCn || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
