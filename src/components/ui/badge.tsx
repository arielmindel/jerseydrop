import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-surface text-muted",
        accent:
          "border-accent/30 bg-accent/10 text-accent shadow-[0_0_10px_rgba(0,255,136,0.25)]",
        gold: "border-gold/40 bg-gold/10 text-gold",
        destructive: "border-destructive/40 bg-destructive/10 text-destructive",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
