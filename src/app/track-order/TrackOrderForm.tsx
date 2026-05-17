"use client";

import { useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/constants";

/**
 * Until we ship the real tracking lookup, this form just composes a
 * WhatsApp message with the order number + email and opens our chat.
 * Customer service has the order details and replies with status.
 */
export default function TrackOrderForm() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = orderId.trim();
    const em = email.trim();
    const msg = `שלום, אני רוצה לעקוב אחרי הזמנה.\nמספר הזמנה: ${id || "—"}\nמייל: ${em || "—"}`;
    window.open(whatsappLink(msg), "_blank", "noopener,noreferrer");
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-border bg-foreground/[0.03] p-5"
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">
          מספר הזמנה
        </span>
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          placeholder="למשל: JD-2026-0123"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full rounded-lg border border-border bg-background/40 px-4 py-3 text-base text-foreground placeholder:text-foreground/40 focus:border-[#00B85F] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">
          מייל שאיתו הזמנת
        </span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-background/40 px-4 py-3 text-base text-foreground placeholder:text-foreground/40 focus:border-[#00B85F] focus:outline-none"
        />
      </label>
      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#00B85F] px-6 font-display text-base font-bold uppercase tracking-wide text-black shadow-[0_8px_24px_-8px_rgba(0,184,95,0.7)] transition-transform duration-150 active:scale-95"
      >
        <MessageCircle className="h-5 w-5" />
        בדוק סטטוס ב-WhatsApp
        <ArrowLeft className="h-5 w-5" />
      </button>
    </form>
  );
}
