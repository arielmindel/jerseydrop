"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const ERROR_COPY: Record<string, string> = {
  no_access: "החשבון הזה אינו רשום כמנהל. פנה למנהל המערכת.",
  invalid_credentials: "אימייל או סיסמה שגויים.",
  generic: "משהו השתבש. נסה שוב בעוד רגע.",
};

export default function LoginForm({ errorParam }: { errorParam?: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam && ERROR_COPY[errorParam] ? ERROR_COPY[errorParam] : null,
  );

  // Pre-fill email from last successful login so Safari can trigger
  // Touch ID autofill for the password the moment the page renders.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("jd:admin:email");
      if (saved) setEmail(saved);
    } catch {
      // private-browsing / blocked storage — fine, just no pre-fill
    }
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = getBrowserSupabase();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(
        authError.message.toLowerCase().includes("invalid")
          ? ERROR_COPY.invalid_credentials
          : ERROR_COPY.generic,
      );
      setSubmitting(false);
      return;
    }
    // Remember the email locally for next visit (password stays in the
    // iCloud / browser keychain, never in our storage).
    try {
      window.localStorage.setItem("jd:admin:email", email);
    } catch {
      // ignore
    }
    // Successful auth — middleware will check admin_users membership on
    // the next page load and bounce back here with ?error=no_access if
    // the user isn't an admin.
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-12">
      {/* Brand-tinted backdrop — neon green wash bottom-right, deep
           background. Same dark vibe as the public site, just calmer. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -end-24 h-96 w-96 rounded-full bg-accent/15 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -start-24 h-96 w-96 rounded-full bg-violet/10 blur-[160px]"
      />

      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-surface/80 p-8 backdrop-blur-md edge-light">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/logo/logo-mark.png"
            alt="JerseyDrop"
            width={96}
            height={96}
            className="h-16 w-auto"
            priority
          />
          <div>
            <div className="font-display text-overline tracking-[0.22em] text-accent">
              Admin
            </div>
            <h1 className="mt-1 font-display text-h1 font-black uppercase">
              כניסת מנהל
            </h1>
            <p className="mt-1 text-body-sm text-muted">
              גישה מותרת לחברי הצוות בלבד.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@jerseydrop.co.il"
              dir="ltr"
              className="text-end"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
              className="text-end"
            />
          </div>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-caption text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting || !email || !password}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> מתחבר…
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" /> התחברות
              </>
            )}
          </Button>

          <p className="pt-2 text-center text-caption text-muted">
            שכחת סיסמה? פנה למנהל המערכת לאיפוס.
          </p>
        </form>
      </div>
    </section>
  );
}
