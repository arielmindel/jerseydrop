import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SectionEyebrow — the small uppercase tracked label that sits above section
 * headlines. Centralised so we can change colour/letter-spacing once and have
 * every section follow.
 *
 *   <SectionEyebrow>World Cup 2026</SectionEyebrow>
 *   <SectionEyebrow tone="gold">Vintage Drop</SectionEyebrow>
 */
type Tone = "accent" | "gold" | "muted" | "cyan" | "violet" | "rose";

const toneClass: Record<Tone, string> = {
  accent: "text-accent",
  gold: "text-gold",
  muted: "text-muted",
  cyan: "text-cyan",
  violet: "text-violet",
  rose: "text-rose",
};

export function SectionEyebrow({
  tone = "accent",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "block font-display text-[0.6875rem] font-extrabold uppercase leading-none tracking-[0.22em]",
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
