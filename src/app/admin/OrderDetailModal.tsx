"use client";

import { useEffect } from "react";
import { X, Truck, MapPin, User, Phone, Mail, Package } from "lucide-react";
import {
  type OrderRow,
  type OrderStatus,
  STATUS_LABELS,
  shortOrderId,
} from "@/lib/supabase/types";
import { formatILS } from "@/lib/utils";

const STATUS_OPTIONS: OrderStatus[] = [
  "awaiting_batch",
  "ordered_from_supplier",
  "arrived_in_country",
  "shipped_to_customer",
  "completed",
];

export default function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
}: {
  order: OrderRow;
  onClose: () => void;
  onStatusChange: (next: OrderStatus) => void;
}) {
  // Esc to close — standard modal accessibility.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface edge-light shadow-glow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-surface/90 p-5 backdrop-blur">
          <div>
            <div className="font-display text-overline tracking-[0.18em] text-accent">
              {shortOrderId(order.id)}
            </div>
            <h2
              id="order-modal-title"
              className="mt-1 font-display text-h2 font-black uppercase"
            >
              {order.customer_name}
            </h2>
            <div className="mt-1 text-caption text-muted">
              {new Date(order.created_at).toLocaleString("he-IL")}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors duration-base hover:border-accent hover:text-accent"
            aria-label="סגור"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          <Section icon={User} title="לקוח">
            <Row label="שם" value={order.customer_name} />
            <Row
              label="טלפון"
              value={
                <a href={`tel:${order.customer_phone}`} className="text-accent">
                  <Phone className="me-1 inline h-3 w-3" />
                  {order.customer_phone}
                </a>
              }
            />
            {order.customer_email && (
              <Row
                label="אימייל"
                value={
                  <a
                    href={`mailto:${order.customer_email}`}
                    className="text-accent"
                  >
                    <Mail className="me-1 inline h-3 w-3" />
                    {order.customer_email}
                  </a>
                }
              />
            )}
          </Section>

          <Section icon={MapPin} title="כתובת משלוח">
            <Row label="עיר" value={order.shipping_city} />
            <Row label="רחוב" value={order.shipping_street} />
            {order.shipping_building && (
              <Row label="בניין" value={order.shipping_building} />
            )}
            {order.shipping_apartment && (
              <Row label="דירה" value={order.shipping_apartment} />
            )}
            {order.shipping_postal && (
              <Row label="מיקוד" value={order.shipping_postal} />
            )}
          </Section>
        </div>

        <div className="border-t border-border p-5">
          <div className="mb-3 flex items-center gap-2 font-display text-overline tracking-[0.18em] text-accent">
            <Package className="h-4 w-4" /> פריטים ({order.items.length})
          </div>
          <ul className="divide-y divide-border/60 rounded-xl border border-border bg-background">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-start gap-3 p-3">
                <div className="font-display text-overline text-muted">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-display font-bold text-foreground">
                    {it.team || it.nameHe}
                  </div>
                  <div className="text-caption text-muted">
                    {it.nameHe}
                    {it.season ? ` · ${it.season}` : ""} · {it.version}
                    {it.size ? ` · מידה ${it.size}` : ""} · ×{it.quantity}
                  </div>
                  {it.customization?.nameNumberEnabled && (
                    <div className="mt-1 inline-flex flex-wrap gap-2 text-caption text-accent">
                      {it.customization.name && (
                        <span>שם: {it.customization.name}</span>
                      )}
                      {it.customization.number && (
                        <span>מספר: {it.customization.number}</span>
                      )}
                    </div>
                  )}
                  {it.customization?.customerNotes && (
                    <div className="mt-1 text-caption text-muted">
                      📝 {it.customization.customerNotes}
                    </div>
                  )}
                </div>
                <div className="font-display font-bold text-foreground">
                  {formatILS(Number(it.unitPrice) * (it.quantity || 1))}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border bg-surface/60 p-5">
          <div className="grid gap-2 text-body-sm">
            <Row
              label="סיכום ביניים"
              value={formatILS(Number(order.subtotal))}
            />
            <Row
              label="משלוח"
              value={
                Number(order.shipping_cost) === 0
                  ? "חינם"
                  : formatILS(Number(order.shipping_cost))
              }
            />
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="font-display text-overline tracking-[0.18em] text-muted">
                סה״כ
              </span>
              <span className="font-display text-h1 font-black text-accent">
                {formatILS(Number(order.total))}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-display text-overline tracking-[0.18em] text-muted">
              סטטוס
            </span>
            <select
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
              className="cursor-pointer rounded-full border border-border bg-background px-4 py-1.5 font-display text-caption font-bold uppercase tracking-[0.14em] text-foreground focus:border-accent focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-display text-[0.625rem] font-bold uppercase tracking-[0.14em] ${
                order.payment_status === "paid"
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-amber/40 bg-amber/15 text-amber"
              }`}
            >
              <Truck className="h-3 w-3" />
              {order.payment_method} · {order.payment_status}
            </span>
          </div>

          {order.internal_notes && (
            <div className="mt-3 rounded-lg border border-border bg-background p-3 text-caption text-muted">
              <strong className="text-foreground">הערה פנימית:</strong>{" "}
              {order.internal_notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2 font-display text-overline tracking-[0.18em] text-accent">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="space-y-1.5 text-body-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
