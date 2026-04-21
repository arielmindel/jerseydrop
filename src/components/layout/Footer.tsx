import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-background">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <div className="font-display text-xl font-black uppercase tracking-tight">
            Jersey<span className="text-accent">Drop</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            חולצות רשמיות לנבחרות ולמועדונים. איכות, התאמה אישית, משלוח לכל
            הארץ.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-accent">
            קישורים מהירים
          </h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link className="hover:text-foreground" href="/products">
                כל החולצות
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/about">
                עלינו
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/contact">
                צור קשר
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/size-guide">
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
              <Link className="hover:text-foreground" href="/leagues">
                ליגות
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/nations">
                נבחרות
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/retro">
                רטרו
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-accent">
            צור קשר
          </h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>WhatsApp: בקרוב</li>
            <li>אימייל: hello@jerseydrop.co.il</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted md:flex-row">
          <div>© {new Date().getFullYear()} JerseyDrop. כל הזכויות שמורות.</div>
          <div className="flex gap-4">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>PayPal</span>
            <span>Bit</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
