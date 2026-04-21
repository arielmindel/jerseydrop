"use client";

import { useState, type FormEvent } from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setStatus("submitting");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
      e.currentTarget.reset();
    } catch {
      setError("לא הצלחנו לשלוח. נסו שוב או פנו בוואטסאפ.");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-display text-xl font-bold uppercase tracking-tight">
        שליחת פנייה
      </h2>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">שם</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">אימייל</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subject">נושא</Label>
          <Input id="subject" name="subject" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="message">הודעה</Label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className="flex w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/70 focus:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            placeholder="כתבו לנו מה תרצו לדעת…"
          />
        </div>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={status === "submitting"}>
        {status === "success" ? (
          <>
            <Check className="h-4 w-4" /> קיבלנו, תודה!
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> שליחה
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
