"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export default function AdminHeader({ email }: { email: string }) {
  const router = useRouter();

  const onLogout = async () => {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
      />
      <div className="container relative flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo/logo-mark.png"
            alt="JerseyDrop"
            width={40}
            height={40}
            className="h-10 w-auto"
          />
          <div className="leading-tight">
            <div className="font-display text-overline tracking-[0.18em] text-accent">
              Admin
            </div>
            <h1 className="font-display text-body font-bold uppercase">
              פאנל ניהול JerseyDrop
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-caption text-muted md:inline" dir="ltr">
            {email}
          </span>
          <Link
            href="/"
            target="_blank"
            className="hidden items-center gap-1 text-caption text-muted transition-colors duration-base hover:text-accent md:inline-flex"
          >
            <ExternalLink className="h-3.5 w-3.5" /> אתר
          </Link>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            התנתק
          </Button>
        </div>
      </div>
    </header>
  );
}
