import Link from "next/link";

export default function Home() {
  return (
    <section className="container flex min-h-[70vh] flex-col items-start justify-center gap-6 py-20">
      <span className="section-eyebrow">Coming soon</span>
      <h1 className="max-w-3xl font-display text-5xl font-black uppercase leading-[1.05] text-foreground md:text-7xl">
        הגיע הזמן <span className="text-accent">ללבוש את הצבעים</span>
      </h1>
      <p className="max-w-xl text-base leading-relaxed text-muted md:text-lg">
        חולצות רשמיות לנבחרות ולמועדונים. משלוח לכל הארץ. גרסת Fan ו-Player,
        עם או בלי שם ומספר.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/products"
          className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 font-display text-sm font-bold uppercase tracking-wide text-accent-foreground shadow-glow transition-transform hover:-translate-y-0.5"
        >
          לקולקציה ←
        </Link>
        <Link
          href="/nations"
          className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface px-6 font-display text-sm font-bold uppercase tracking-wide text-foreground transition-colors hover:border-accent"
        >
          מונדיאל 2026
        </Link>
      </div>
    </section>
  );
}
