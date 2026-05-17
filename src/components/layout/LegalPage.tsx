import { ReactNode } from "react";

/**
 * Shared shell for legal / info pages (shipping, returns, terms,
 * privacy, about, etc). Centered max-w-3xl, RTL-aware spacing,
 * "עדכון אחרון" date stamp at the top.
 */
export default function LegalPage({
  title,
  updated = "מאי 2026",
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <header className="mb-8 border-b border-white/10 pb-6">
        <h1 className="font-display text-3xl font-black md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-white/55">עדכון אחרון: {updated}</p>
      </header>
      <div className="space-y-5 text-base leading-relaxed text-white/80 md:text-lg [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white md:[&_h2]:text-2xl [&_a]:text-[#00FF88] [&_a]:underline-offset-4 hover:[&_a]:underline [&_strong]:text-white [&_ul]:list-disc [&_ul]:ps-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:ps-6 [&_ol]:space-y-2">
        {children}
      </div>
    </article>
  );
}
