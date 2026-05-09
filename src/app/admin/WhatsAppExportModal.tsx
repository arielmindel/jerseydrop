"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, X, Check } from "lucide-react";
import type { OrderRow } from "@/lib/supabase/types";

/**
 * Aggregates the line items across the selected orders so duplicate
 * jerseys (same team / type / season / size / customization fingerprint)
 * collapse to one line with a quantity. Then formats it as the supplier
 * WhatsApp message Ariel asked for.
 *
 * The aggregation key intentionally includes customization name+number
 * because two "Real Madrid Home M" jerseys are NOT the same to the
 * supplier if one is "MESSI 10" and the other plain.
 */
function buildMessage(orders: OrderRow[]): {
  text: string;
  totalJerseys: number;
  uniqueLines: number;
} {
  type Bucket = {
    team: string;
    type: string;
    season: string;
    size: string;
    custom: string;
    qty: number;
  };
  const buckets = new Map<string, Bucket>();

  for (const o of orders) {
    for (const it of o.items) {
      const c = it.customization || { nameNumberEnabled: false };
      const customParts: string[] = [];
      if (c.nameNumberEnabled && (c.name || c.number)) {
        customParts.push(
          `${c.name ? `Name=${c.name}` : ""}${c.number ? ` Number=${c.number}` : ""}`.trim(),
        );
      }
      if (c.selectedPatchId) customParts.push(`Patch=${c.selectedPatchId}`);
      const custom = customParts.join(" | ");

      const team = it.team || it.nameHe || "Unknown";
      const type = (it.type || it.version || "home").toString();
      const season = it.season || "";
      const size = it.size || "OS";

      const key = [team, type, season, size, custom].join("◆");
      const cur = buckets.get(key);
      const qty = it.quantity || 1;
      if (cur) {
        cur.qty += qty;
      } else {
        buckets.set(key, { team, type, season, size, custom, qty });
      }
    }
  }

  const lines = Array.from(buckets.values()).sort((a, b) =>
    a.team.localeCompare(b.team),
  );

  const totalJerseys = lines.reduce((s, l) => s + l.qty, 0);
  const uniqueLines = lines.length;

  const numbered = lines
    .map((l, i) => {
      const seasonChunk = l.season ? ` ${l.season}` : "";
      const customChunk = l.custom ? ` | ${l.custom}` : "";
      return `${i + 1}. ${l.team} ${l.type}${seasonChunk} | Size ${l.size}${customChunk} | x${l.qty}`;
    })
    .join("\n");

  const text = `Hi, please prepare these jerseys:

${numbered}

Total: ${totalJerseys} jerseys, ${uniqueLines} different products`;

  return { text, totalJerseys, uniqueLines };
}

export default function WhatsAppExportModal({
  orders,
  onClose,
}: {
  orders: OrderRow[];
  onClose: () => void;
}) {
  const { text, totalJerseys, uniqueLines } = useMemo(
    () => buildMessage(orders),
    [orders],
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      // Match the design "toast"-like signal — show "הועתק!" for 2.5s then
      // reset so a re-copy is obvious.
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
      alert("לא הצלחנו להעתיק. סמן ידנית והעתק.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-accent/40 bg-surface edge-light shadow-glow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <div className="font-display text-overline tracking-[0.18em] text-accent">
              Supplier export
            </div>
            <h2 className="mt-1 font-display text-h2 font-black uppercase">
              ייצא לוואטסאפ
            </h2>
            <div className="mt-1 text-caption text-muted">
              {totalJerseys} חולצות · {uniqueLines} מוצרים שונים · מתוך{" "}
              {orders.length} הזמנות
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors duration-base hover:border-accent hover:text-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="p-5">
          <textarea
            readOnly
            value={text}
            dir="ltr"
            className="h-72 w-full resize-none rounded-xl border border-border bg-background p-3 font-mono text-caption text-foreground focus:border-accent focus:outline-none"
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border bg-surface/60 p-4">
          <p className="text-caption text-muted">
            לוחצים &quot;העתק&quot; ← פותחים וואטסאפ ← מדביקים בצ&apos;אט עם הספק.
          </p>
          <button
            type="button"
            onClick={copy}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 font-display text-caption font-bold uppercase tracking-[0.14em] transition-all duration-base ease-emphasized ${
              copied
                ? "border-accent bg-accent text-accent-foreground shadow-glow"
                : "border-accent/60 bg-accent/15 text-accent shadow-glow-sm hover:-translate-y-0.5 hover:bg-accent/25"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" /> הועתק! פתח וואטסאפ ושלח לספק
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> העתק טקסט
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
