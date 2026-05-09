"use client";

import { useState } from "react";
import { CheckCircle2, MessageCircle, Truck, X } from "lucide-react";
import {
  type OrderRow,
  type OrderStatus,
  STATUS_LABELS,
} from "@/lib/supabase/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import WhatsAppExportModal from "./WhatsAppExportModal";

/**
 * Sticky bar that appears whenever the user has at least one order checked
 * in the table. Three actions:
 *  - Mark "ordered_from_supplier"
 *  - Mark "arrived_in_country"
 *  - Open WhatsApp-export modal (clipboard copy of aggregated supplier list)
 */
export default function BulkActionsBar({
  selectedIds,
  orders,
  onClear,
  onStatusChange,
}: {
  selectedIds: string[];
  orders: OrderRow[];
  onClear: () => void;
  onStatusChange: (ids: string[], next: OrderStatus) => void;
}) {
  const [showExport, setShowExport] = useState(false);
  const [busy, setBusy] = useState<OrderStatus | null>(null);

  const bulkSetStatus = async (next: OrderStatus) => {
    setBusy(next);
    onStatusChange(selectedIds, next); // optimistic
    const supabase = getBrowserSupabase();
    const { error } = await supabase
      .from("orders")
      .update({ status: next })
      .in("id", selectedIds);
    if (error) {
      console.error(error);
      alert(`עדכון נכשל: ${error.message}`);
    }
    setBusy(null);
  };

  return (
    <>
      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-background/90 p-3 backdrop-blur-xl shadow-glow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClear}
            aria-label="בטל בחירה"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition-colors duration-base hover:border-accent hover:text-accent"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="font-display text-body-sm font-bold text-foreground">
            {selectedIds.length} הזמנות נבחרו
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => bulkSetStatus("ordered_from_supplier")}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/10 px-3 py-1.5 font-display text-caption font-bold uppercase tracking-[0.14em] text-amber transition-all duration-base hover:-translate-y-0.5 hover:bg-amber/20 disabled:opacity-50"
          >
            <Truck className="h-3.5 w-3.5" />
            סמן כ{STATUS_LABELS.ordered_from_supplier}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => bulkSetStatus("arrived_in_country")}
            className="inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-display text-caption font-bold uppercase tracking-[0.14em] text-cyan transition-all duration-base hover:-translate-y-0.5 hover:bg-cyan/20 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            סמן כ{STATUS_LABELS.arrived_in_country}
          </button>
          <button
            type="button"
            onClick={() => setShowExport(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/15 px-3 py-1.5 font-display text-caption font-bold uppercase tracking-[0.14em] text-accent shadow-glow-sm transition-all duration-base hover:-translate-y-0.5 hover:bg-accent/25"
          >
            <MessageCircle className="h-3.5 w-3.5" /> ייצא לוואטסאפ
          </button>
        </div>
      </div>

      {showExport && (
        <WhatsAppExportModal
          orders={orders}
          onClose={() => setShowExport(false)}
        />
      )}
    </>
  );
}
