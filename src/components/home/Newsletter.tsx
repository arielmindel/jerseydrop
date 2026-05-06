"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";

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
    <section className="container section-y">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface edge-light p-8 md:p-12">
        {/* Two-tone aurora glow — accent + violet for depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 start-1/4 h-72 w-72 rounded-full bg-accent/20 blur-[130px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 end-1/4 h-72 w-72 rounded-full bg-violet/15 blur-[140px]"
        />
        <div className="relative grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
          <div className="space-y-3">
            <SectionEyebrow>Newsletter</SectionEyebrow>
            <h2 className="font-display text-display font-black uppercase">
              תהיו הראשונים לדעת
            </h2>
            <p className="max-w-md text-body-sm leading-relaxed text-muted md:text-body">
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
                className="group/cta inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 font-display text-sm font-bold uppercase tracking-wide text-accent-foreground shadow-glow transition-all duration-base ease-emphasized hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "success" ? (
                  <>
                    <Check className="h-4 w-4" /> הוספת
                  </>
                ) : (
                  <>
                    הרשמה
                    <ArrowLeft className="h-4 w-4 transition-transform duration-base group-hover/cta:-translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
            {status === "error" && (
              <p
                role="alert"
                aria-live="polite"
                className="text-caption text-destructive"
              >
                אנא הזינו אימייל תקין.
              </p>
            )}
            {status === "success" && (
              <p
                role="status"
                aria-live="polite"
                className="text-caption text-accent"
              >
                תודה! נשלח לך עדכון על הקולקציה הבאה.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
