import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton — shimmering placeholder for async content. Always reserve the
 * exact final size so swapping in real content doesn't shift layout (CLS).
 *
 * Usage:
 *   <Skeleton className="h-48 w-full" />            — generic block
 *   <Skeleton className="aspect-[4/5] w-full" />    — product card image
 *   <Skeleton variant="text" className="w-32" />    — single text line
 */
type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "block" | "text" | "circle";
};

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "block", ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "relative isolate overflow-hidden bg-surface-2/60",
        variant === "text" && "h-3 rounded",
        variant === "circle" && "rounded-full",
        variant === "block" && "rounded-xl",
        // The shimmer band sweeps across the placeholder. Pure transform
        // animation, GPU-accelerated, respects reduced-motion via globals.
        "before:absolute before:inset-0 before:translate-x-[-100%] before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent",
        className,
      )}
      {...props}
    />
  ),
);
Skeleton.displayName = "Skeleton";

/**
 * ProductCardSkeleton — drop into a product grid while data is loading.
 * Keeps the same aspect ratio so the grid doesn't reflow.
 */
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/3" />
    </div>
  );
}
