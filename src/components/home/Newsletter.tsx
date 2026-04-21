"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    // TODO(step 12+): wire to Klaviyo / Mailchimp / custom API
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 600);
  };

  return (
    <section className="container py-16 md:py-24">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 md:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 start-1/4 h-72 w-72 rounded-full bg-accent/20 blur-[130px]"
        />
        <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-2">
            <span className="section-eyebrow">Newsletter</span>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight md:text-4xl">
              תהיו הראשונים לדעת
            </h2>
            <p className="text-sm text-muted md:text-base">
              קולקציות חדשות, מהדורות מוגבלות של המונדיאל, ומבצעים רק למנויים.
              בלי ספאם — אפשר לבטל בכל רגע.
            </p>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="האימייל שלך"
                aria-label="כתובת אימייל לניוזלטר"
                className="h-12 flex-1 rounded-full px-5"
                disabled={status === "submitting" || status === "success"}
              />
              <button
                type="submit"
                disabled={status === "submitting" || status === "success"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 font-display text-sm font-bold uppercase tracking-wide text-accent-foreground shadow-glow transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "success" ? (
                  <>
                    <Check className="h-4 w-4" /> הוספת
                  </>
                ) : (
                  <>
                    הרשמה <ArrowLeft className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
            {status === "error" && (
              <p className="text-xs text-destructive">אנא הזינו אימייל תקין.</p>
            )}
            {status === "success" && (
              <p className="text-xs text-accent">
                תודה! נשלח לך עדכון על הקולקציה הבאה.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
