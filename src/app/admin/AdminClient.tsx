"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  type OrderRow,
  type OrderStatus,
  STATUS_LABELS,
} from "@/lib/supabase/types";
import StatsCards from "./StatsCards";
import OrdersTable from "./OrdersTable";
import BulkActionsBar from "./BulkActionsBar";
import OrderDetailModal from "./OrderDetailModal";

type StatusFilter = OrderStatus | "all";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "הכל" },
  { value: "awaiting_batch", label: STATUS_LABELS.awaiting_batch },
  { value: "ordered_from_supplier", label: STATUS_LABELS.ordered_from_supplier },
  { value: "arrived_in_country", label: STATUS_LABELS.arrived_in_country },
  { value: "shipped_to_customer", label: STATUS_LABELS.shipped_to_customer },
  { value: "completed", label: STATUS_LABELS.completed },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function AdminClient({
  initialOrders,
}: {
  initialOrders: OrderRow[];
}) {
  // Local state for the optimistic-update flow (status changes via inline
  // dropdown). Keeps the UI snappy without re-fetching the whole list.
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState<string>(daysAgo(30));
  const [dateTo, setDateTo] = useState<string>(daysAgo(0));
  const [search, setSearch] = useState("");
  const [showTest, setShowTest] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const fromTs = new Date(dateFrom + "T00:00:00").getTime();
    const toTs = new Date(dateTo + "T23:59:59").getTime();
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (!showTest && o.is_test) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      const ts = new Date(o.created_at).getTime();
      if (ts < fromTs || ts > toTs) return false;
      if (q) {
        const hay = `${o.customer_name} ${o.customer_phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, dateFrom, dateTo, search, showTest]);

  const updateStatus = (id: string, next: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: next } : o)),
    );
    setSelectedIds([]);
  };

  const updateMany = (ids: string[], next: OrderStatus) => {
    const set = new Set(ids);
    setOrders((prev) =>
      prev.map((o) => (set.has(o.id) ? { ...o, status: next } : o)),
    );
    setSelectedIds([]);
  };

  const openOrder = orders.find((o) => o.id === openOrderId) || null;

  return (
    <>
      <StatsCards orders={orders} />

      {/* ---------- Filter bar ---------- */}
      <section className="rounded-2xl border border-border bg-surface/60 p-4 edge-light">
        <div className="space-y-4">
          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  aria-pressed={active}
                  className={`rounded-full border px-3.5 py-1.5 font-display text-caption font-bold uppercase tracking-[0.14em] transition-all duration-fast ease-emphasized ${
                    active
                      ? "border-accent/60 bg-accent/15 text-accent shadow-glow-sm"
                      : "border-border bg-surface text-muted hover:-translate-y-0.5 hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Date + search + test toggle */}
          <div className="grid gap-3 md:grid-cols-[auto_auto_1fr_auto]">
            <div className="flex items-center gap-2 text-caption text-muted">
              <span>מ-</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-caption text-foreground focus:border-accent focus:outline-none"
              />
              <span>עד</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-caption text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div className="md:hidden" />
            <div className="relative">
              <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש לפי שם או טלפון…"
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 pe-9 text-body-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-caption text-muted">
              <input
                type="checkbox"
                checked={showTest}
                onChange={(e) => setShowTest(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-accent"
              />
              הצג הזמנות בדיקה
            </label>
          </div>
        </div>
      </section>

      {/* ---------- Bulk actions ---------- */}
      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedIds={selectedIds}
          orders={orders.filter((o) => selectedIds.includes(o.id))}
          onClear={() => setSelectedIds([])}
          onStatusChange={updateMany}
        />
      )}

      {/* ---------- Orders table ---------- */}
      <OrdersTable
        orders={filtered}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onOpen={setOpenOrderId}
        onStatusChange={updateStatus}
      />

      {openOrder && (
        <OrderDetailModal
          order={openOrder}
          onClose={() => setOpenOrderId(null)}
          onStatusChange={(next) => updateStatus(openOrder.id, next)}
        />
      )}
    </>
  );
}
