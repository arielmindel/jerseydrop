import { ShoppingBag, TrendingUp, Receipt, Clock } from "lucide-react";
import type { OrderRow } from "@/lib/supabase/types";
import { formatILS } from "@/lib/utils";

/**
 * Top stats row on the admin dashboard. Numbers are computed off the raw
 * orders array we already fetched for the table — saves an extra round
 * trip and keeps everything coherent (table + stats always agree).
 *
 * "החודש" = first day of the current month onwards. We compute the
 * boundary in the user's local timezone to match what they'd intuitively
 * see in the table date column.
 */
export default function StatsCards({ orders }: { orders: OrderRow[] }) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const thisMonth = orders.filter(
    (o) => new Date(o.created_at) >= monthStart && !o.is_test,
  );
  const monthlyOrders = thisMonth.length;
  const monthlyRevenue = thisMonth.reduce((sum, o) => sum + Number(o.total), 0);
  const allRealOrders = orders.filter((o) => !o.is_test);
  const avgBasket = allRealOrders.length
    ? allRealOrders.reduce((sum, o) => sum + Number(o.total), 0) /
      allRealOrders.length
    : 0;
  const awaitingBatch = allRealOrders.filter(
    (o) => o.status === "awaiting_batch",
  ).length;

  const cards = [
    {
      icon: ShoppingBag,
      label: "הזמנות החודש",
      value: monthlyOrders.toLocaleString("he-IL"),
      tone: "accent",
    },
    {
      icon: TrendingUp,
      label: "מכירות החודש",
      value: formatILS(Math.round(monthlyRevenue)),
      tone: "cyan",
    },
    {
      icon: Receipt,
      label: "סל ממוצע",
      value: formatILS(Math.round(avgBasket)),
      tone: "violet",
    },
    {
      icon: Clock,
      label: "בהמתנה לאצווה",
      value: awaitingBatch.toLocaleString("he-IL"),
      tone: "amber",
    },
  ] as const;

  const toneClass: Record<string, string> = {
    accent: "text-accent",
    cyan: "text-cyan",
    violet: "text-violet",
    amber: "text-amber",
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-4 edge-light transition-all duration-base ease-emphasized hover:-translate-y-0.5 hover:border-accent/30"
        >
          <div className="flex items-center justify-between">
            <span className={`font-display text-overline tracking-[0.18em] ${toneClass[c.tone]}`}>
              {c.label}
            </span>
            <c.icon className={`h-4 w-4 ${toneClass[c.tone]}`} />
          </div>
          <div className="mt-3 font-display text-display font-black leading-none">
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}
