import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-bold uppercase tracking-wide transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-foreground shadow-glow hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0",
        secondary:
          "border border-border bg-surface text-foreground hover:border-accent/60 hover:bg-surface/80",
        outline:
          "border border-border bg-transparent text-foreground hover:border-accent hover:text-accent",
        ghost: "bg-transparent text-foreground hover:bg-surface",
        destructive:
          "bg-destructive text-foreground hover:bg-destructive/90",
        gold: "bg-gold text-background shadow-gold hover:-translate-y-0.5",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 rounded-full px-4 text-xs",
        md: "h-11 rounded-full px-6 text-sm",
        lg: "h-14 rounded-full px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
