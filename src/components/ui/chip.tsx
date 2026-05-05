import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Chip — pill-shaped badge for filter toggles, category labels, and inline
 * metadata (season tag, kit type, "RETRO", etc.).
 *
 * Sizes: sm (table cells), md (default — filter rows), lg (hero stamps).
 *
 * Variants:
 *   - default      → muted surface, used for off-state filters
 *   - accent       → neon-green active state (selected filter, primary tag)
 *   - gold         → premium / retro marker (use sparingly)
 *   - outline      → transparent body, ringed border
 *   - destructive  → "sold-out" / "discontinued"
 *
 * For interactive chips (filter toggles), use <ChipButton>. The plain
 * <Chip> is a passive <span> for static labels.
 */
const chipVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-display font-bold uppercase tracking-wide leading-none transition-all duration-fast ease-emphasized focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border border-border bg-surface/60 text-muted hover:border-accent/40 hover:text-foreground",
        accent:
          "border border-accent/60 bg-accent/15 text-accent shadow-glow-sm",
        gold: "border border-gold/60 bg-gold/15 text-gold shadow-gold",
        outline:
          "border border-border bg-transparent text-foreground hover:border-accent hover:text-accent",
        destructive:
          "border border-destructive/60 bg-destructive/15 text-destructive",
      },
      size: {
        sm: "h-6 px-2.5 text-[0.6875rem] tracking-[0.12em]",
        md: "h-8 px-3.5 text-xs tracking-[0.14em]",
        lg: "h-10 px-5 text-sm tracking-[0.16em]",
      },
      interactive: {
        true: "cursor-pointer hover:-translate-y-0.5 active:translate-y-0",
        false: "",
      },
    },
    defaultVariants: { variant: "default", size: "md", interactive: false },
  },
);

export type ChipVariants = VariantProps<typeof chipVariants>;

export const Chip = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & ChipVariants
>(({ className, variant, size, interactive, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(chipVariants({ variant, size, interactive }), className)}
    {...props}
  />
));
Chip.displayName = "Chip";

export const ChipButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & ChipVariants
>(({ className, variant, size, interactive = true, ...props }, ref) => (
  <button
    ref={ref}
    type={props.type ?? "button"}
    className={cn(chipVariants({ variant, size, interactive }), className)}
    {...props}
  />
));
ChipButton.displayName = "ChipButton";
