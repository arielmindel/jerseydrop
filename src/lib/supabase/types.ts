/**
 * DB row shapes for the Supabase tables we wrote in the init migration.
 * Kept hand-written instead of generated so we can edit schema + types in
 * one PR without running `supabase gen types`.
 */

export type OrderStatus =
  | "awaiting_batch"
  | "ordered_from_supplier"
  | "arrived_in_country"
  | "shipped_to_customer"
  | "completed";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type OrderItem = {
  productId: string;
  slug: string;
  nameHe: string;
  nameEn?: string;
  team?: string;
  season?: string;
  type?: string;
  image: string;
  version: "fan" | "player" | "retro";
  size: string;
  quantity: number;
  unitPrice: number;
  customization: {
    nameNumberEnabled: boolean;
    name?: string;
    number?: string;
    selectedPatchId?: string;
    customerNotes?: string;
  };
};

export type OrderRow = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_city: string;
  shipping_street: string;
  shipping_building: string | null;
  shipping_apartment: string | null;
  shipping_postal: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_method: string;
  payment_status: PaymentStatus;
  status: OrderStatus;
  status_notes: string | null;
  tracking_number: string | null;
  internal_notes: string | null;
  is_test: boolean;
};

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
};

/** Display-friendly order id: the first 8 chars of the UUID, prefixed JD-. */
export function shortOrderId(uuid: string): string {
  return `JD-${uuid.slice(0, 8).toUpperCase()}`;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_batch: "ממתין לאצווה",
  ordered_from_supplier: "הוזמן מהספק",
  arrived_in_country: "הגיע ארצה",
  shipped_to_customer: "נשלח ללקוח",
  completed: "הושלם",
};

export const STATUS_TONES: Record<OrderStatus, "muted" | "amber" | "cyan" | "violet" | "accent"> = {
  awaiting_batch: "muted",
  ordered_from_supplier: "amber",
  arrived_in_country: "cyan",
  shipped_to_customer: "violet",
  completed: "accent",
};
