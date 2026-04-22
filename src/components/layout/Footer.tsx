import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Mail, Instagram, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-background">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-4">
          <Image
            src="/logo/logo-192.png"
            alt="JerseyDrop"
            width={192}
            height={192}
            className="h-16 w-auto"
          />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            חולצות רשמיות לנבחרות ולמועדונים. איכות, התאמה אישית, משלוח לכל
            הארץ.
          </p>
          <div className="flex gap-2 pt-1">
            <a
              href="https://wa.me/972000000000"
              aria-label="WhatsApp"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href="mailto:hello@jerseydrop.co.il"
              aria-label="אימייל"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-accent">
            קישורים מהירים
          </h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link className="transition-colors hover:text-foreground" href="/products">
                כל החולצות
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-foreground" href="/about">
                עלינו
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-foreground" href="/contact">
                צור קשר
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-foreground" href="/size-guide">
                מדריך מידות
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-accent">
            קטגוריות
          </h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link className="transition-colors hover:text-foreground" href="/leagues">
                ליגות
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-foreground" href="/nations">
                נבחרות
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-gold" href="/retro">
                רטרו
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-accent">
            שירות
          </h4>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp: בקרוב</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              <a
                href="mailto:hello@jerseydrop.co.il"
                className="transition-colors hover:text-foreground"
              >
                hello@jerseydrop.co.il
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />
              <span>החלפות תוך 14 יום</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="container flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted md:flex-row">
          <div>© {new Date().getFullYear()} JerseyDrop. כל הזכויות שמורות.</div>
          <div className="flex items-center gap-3 font-display text-[10px] font-bold uppercase tracking-widest">
            <span className="rounded border border-border px-2 py-1">VISA</span>
            <span className="rounded border border-border px-2 py-1">MASTERCARD</span>
            <span className="rounded border border-border px-2 py-1">PAYPAL</span>
            <span className="rounded border border-border px-2 py-1">BIT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
