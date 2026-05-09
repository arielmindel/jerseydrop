import Link from "next/link";
import { MessageCircle, Search, ArrowLeft } from "lucide-react";
import { whatsappLink } from "@/lib/constants";

/**
 * Persistent "didn't find what you're looking for?" CTA shown above the
 * footer on every page. Surfaces the WhatsApp pipe as the primary path —
 * many shoppers are looking for a specific jersey/season we may not have
 * indexed yet, and a one-tap WhatsApp to a human closes the gap. A
 * secondary link nudges them back to the search page if they want to
 * keep browsing instead.
 */
export default function CantFindCTA() {
  const message =
    "היי! לא מצאתי באתר את החולצה שחיפשתי, אפשר לבדוק זמינות?";

  return (
    <section className="container pb-12 md:pb-16">
      <div
        className="relative isolate overflow-hidden rounded-3xl border border-accent/30 bg-surface/60 p-6 md:p-10"
        style={{
          backgroundImage:
            "radial-gradient(at 18% 0%, rgba(59,130,246,0.18) 0px, transparent 55%), radial-gradient(at 90% 100%, rgba(252,211,77,0.12) 0px, transparent 55%)",
        }}
      >
        <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-accent" />
              <span className="font-display text-overline tracking-[0.18em] text-accent">
                Got something specific in mind?
              </span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-black uppercase leading-tight md:text-3xl">
              לא מצאתם את החולצה שחיפשתם?
            </h2>
            <p className="mt-2 text-body-sm text-muted md:text-body">
              שלחו לנו הודעה בוואטסאפ עם השם / השחקן / העונה, ואנחנו נדאג
              למצוא ולהזמין במיוחד עבורכם.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 font-display text-sm font-bold uppercase tracking-wide text-background shadow-glow-sm transition-transform duration-base ease-emphasized hover:-translate-y-0.5 md:flex-initial"
            >
              <MessageCircle className="h-4 w-4" />
              דברו איתנו בוואטסאפ
            </a>
            <Link
              href="/search"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-background/40 px-6 font-display text-sm font-bold uppercase tracking-wide text-foreground transition-colors duration-base hover:border-accent/50 hover:text-accent md:flex-initial"
            >
              חיפוש בקטלוג
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
