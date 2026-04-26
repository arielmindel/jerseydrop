import Image from "next/image";
import Link from "next/link";
import MegaMenu from "./MegaMenu";
import MobileMenu from "./MobileMenu";
import CartDrawer from "@/components/cart/CartDrawer";
import SearchBar from "@/components/search/SearchBar";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center transition-transform hover:scale-[1.02]"
            aria-label="JerseyDrop — דף הבית"
          >
            <Image
              src="/logo/logo-256.png"
              alt="JerseyDrop"
              width={256}
              height={256}
              priority
              className="h-14 w-auto md:h-16"
            />
          </Link>
          <MegaMenu />
        </div>
        <div className="flex items-center gap-2">
          <SearchBar variant="header" />
          <CartDrawer />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
