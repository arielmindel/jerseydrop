import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="container flex min-h-[70vh] flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-surface shadow-glow-sm">
        <span className="font-display text-5xl font-black text-accent">404</span>
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-black uppercase md:text-4xl">
          נראה שהדף הזה <span className="text-accent">לא במגרש</span>
        </h1>
        <p className="max-w-sm text-sm text-muted">
          הכתובת לא קיימת — אולי הלינק הישן, אולי טעות הקלדה. תחזרו לעמוד הבית
          ונמשיך משם.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/">לעמוד הבית ←</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">כל החולצות</Link>
        </Button>
      </div>
    </section>
  );
}
