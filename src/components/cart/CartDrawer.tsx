"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SHIPPING } from "@/lib/constants";
import { formatILS } from "@/lib/utils";

/**
 * Shell drawer — connected to Zustand store in Step 9.
 * Currently always renders empty state.
 */
export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const itemCount = 0;
  const subtotal = 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="עגלת קניות"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -end-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-display text-[10px] font-bold text-accent-foreground">
              {itemCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0">
        <SheetHeader>
          <SheetTitle>הסל שלך · {itemCount} פריטים</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background">
              <ShoppingBag className="h-7 w-7 text-muted" />
            </div>
            <p className="font-display text-lg font-bold uppercase tracking-tight">
              הסל ריק
            </p>
            <p className="text-sm text-muted">
              זה הזמן לבחור את החולצה הבאה שלך.
            </p>
            <Button
              asChild
              size="md"
              variant="primary"
              className="mt-3"
              onClick={() => setOpen(false)}
            >
              <Link href="/products">לגלות חולצות ←</Link>
            </Button>
          </div>
        </div>

        <SheetFooter>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">סיכום ביניים</span>
            <span className="font-display font-bold">{formatILS(subtotal)}</span>
          </div>
          <p className="text-xs text-muted">
            משלוח חינם מעל {formatILS(SHIPPING.freeThreshold)} · משלוח רגיל{" "}
            {formatILS(SHIPPING.standardFee)}
          </p>
          <Button
            asChild
            variant="primary"
            size="lg"
            disabled={itemCount === 0}
            className="w-full"
          >
            <Link href="/checkout">לקופה ←</Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
