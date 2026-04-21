import Link from "next/link";
import { Search } from "lucide-react";
import MegaMenu from "./MegaMenu";
import MobileMenu from "./MobileMenu";
import CartDrawer from "@/components/cart/CartDrawer";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-display text-xl font-black uppercase tracking-tight text-foreground md:text-2xl"
            aria-label="JerseyDrop"
          >
            Jersey<span className="text-accent">Drop</span>
          </Link>
          <MegaMenu />
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/products"
            aria-label="חיפוש"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground md:inline-flex"
          >
            <Search className="h-5 w-5" />
          </Link>
          <CartDrawer />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
