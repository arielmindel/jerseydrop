import Link from "next/link";
import { ShoppingBag, Menu, Search } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-display text-xl font-black uppercase tracking-tight text-foreground"
            aria-label="JerseyDrop"
          >
            Jersey<span className="text-accent">Drop</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/leagues"
              className="text-sm font-semibold text-muted transition-colors hover:text-foreground"
            >
              ליגות
            </Link>
            <Link
              href="/nations"
              className="text-sm font-semibold text-muted transition-colors hover:text-foreground"
            >
              נבחרות
            </Link>
            <Link
              href="/retro"
              className="text-sm font-semibold text-muted transition-colors hover:text-foreground"
            >
              רטרו
            </Link>
            <Link
              href="/products"
              className="text-sm font-semibold text-muted transition-colors hover:text-foreground"
            >
              כל החולצות
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="חיפוש"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/cart"
            aria-label="עגלת קניות"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
          <button
            type="button"
            aria-label="תפריט"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
