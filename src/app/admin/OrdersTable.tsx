"use client";

import { ExternalLink, Phone } from "lucide-react";
import {
  type OrderRow,
  type OrderStatus,
  STATUS_LABELS,
  STATUS_TONES,
  shortOrderId,
} from "@/lib/supabase/types";
import { formatILS } from "@/lib/utils";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const STATUS_OPTIONS: OrderStatus[] = [
  "awaiting_batch",
  "ordered_from_supplier",
  "arrived_in_country",
  "shipped_to_customer",
  "completed",
];

const TONE_CLASS: Record<string, string> = {
  muted:
    "border-border bg-surface/80 text-muted",
  amber:
    "border-amber/40 bg-amber/15 text-amber",
  cyan: "border-cyan/40 bg-cyan/15 text-cyan",
  violet: "border-violet/40 bg-violet/15 text-violet",
  accent: "border-accent/50 bg-accent/15 text-accent shadow-glow-sm",
};

function shortDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const MM = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${HH}:${MM}`;
}

export default function OrdersTable({
  orders,
  selectedIds,
  onSelectionChange,
  onOpen,
  onStatusChange,
}: {
  orders: OrderRow[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onOpen: (id: string) => void;
  onStatusChange: (id: string, next: OrderStatus) => void;
}) {
  const allChecked = orders.length > 0 && selectedIds.length === orders.length;
  const toggleAll = () =>
    onSelectionChange(allChecked ? [] : orders.map((o) => o.id));
  const toggleOne = (id: string) =>
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id],
    );

  // Inline status update — optimistic UI + Supabase write. If the write
  // fails we'd ideally roll back; for now we log + alert to keep this
  // commit small. The next iteration adds toast notifications.
  const onStatusSelect = async (id: string, next: OrderStatus) => {
    onStatusChange(id, next);
    const supabase = getBrowserSupabase();
    const { error } = await supabase
      .from("orders")
      .update({ status: next })
      .eq("id", id);
    if (error) {
      console.error(error);
      alert(`עדכון נכשל: ${error.message}`);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center text-muted">
        <p className="font-display text-h3 font-bold">אין הזמנות תואמות</p>
        <p className="mt-1 text-body-sm">נסו לשנות את הפילטרים.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface edge-light">
      <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
        <table className="w-full text-start">
          <thead className="sticky top-0 z-10 bg-surface-2/95 backdrop-blur">
            <tr className="text-end font-display text-overline tracking-[0.18em] text-muted">
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  aria-label="בחר הכל"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer accent-accent"
                />
              </th>
              <th className="px-3 py-3">מספר / תאריך</th>
              <th className="px-3 py-3">לקוח</th>
              <th className="px-3 py-3">טלפון</th>
              <th className="px-3 py-3">פריטים</th>
              <th className="px-3 py-3">סכום</th>
              <th className="px-3 py-3">סטטוס</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.map((o) => {
              const checked = selectedIds.includes(o.id);
              const itemCount = o.items.reduce(
                (sum, it) => sum + (it.quantity || 0),
                0,
              );
              return (
                <tr
                  key={o.id}
                  className={`text-body-sm transition-colors duration-fast ${
                    checked ? "bg-accent/5" : "hover:bg-surface-2/50"
                  } ${o.is_test ? "opacity-70" : ""}`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`בחר הזמנה ${shortOrderId(o.id)}`}
                      checked={checked}
                      onChange={() => toggleOne(o.id)}
                      className="h-4 w-4 cursor-pointer accent-accent"
                    />
                  </td>
                  <td className="px-3 py-3 text-foreground">
                    <div className="font-display text-caption font-bold text-accent">
                      {shortOrderId(o.id)}
                    </div>
                    <div className="text-caption text-muted">
                      {shortDate(o.created_at)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onOpen(o.id)}
                      className="text-start font-bold text-foreground transition-colors duration-base hover:text-accent"
                    >
                      {o.customer_name}
                    </button>
                    {o.is_test && (
                      <span className="ms-2 inline-flex rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted">
                        TEST
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3" dir="ltr">
                    <a
                      href={`tel:${o.customer_phone}`}
                      className="inline-flex items-center gap-1 text-muted transition-colors duration-base hover:text-accent"
                    >
                      <Phone className="h-3 w-3" /> {o.customer_phone}
                    </a>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onOpen(o.id)}
                      className="rounded-full border border-border bg-surface-2 px-3 py-1 font-display text-caption font-bold text-muted transition-colors duration-base hover:border-accent/50 hover:text-foreground"
                    >
                      {itemCount} פריטים
                    </button>
                  </td>
                  <td className="px-3 py-3 font-display font-bold text-foreground">
                    {formatILS(Number(o.total))}
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={o.status}
                      onChange={(e) =>
                        onStatusSelect(o.id, e.target.value as OrderStatus)
                      }
                      className={`cursor-pointer rounded-full border px-3 py-1 font-display text-[0.6875rem] font-bold uppercase tracking-[0.14em] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${TONE_CLASS[STATUS_TONES[o.status]]}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="bg-surface text-foreground">
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onOpen(o.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-3 py-1 font-display text-caption font-bold uppercase tracking-[0.14em] text-foreground transition-all duration-base hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent"
                    >
                      <ExternalLink className="h-3 w-3" /> פתח
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
