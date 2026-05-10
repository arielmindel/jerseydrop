import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { shortOrderId, type OrderItem } from "@/lib/supabase/types";

/**
 * Order creation. Public endpoint — anyone can submit. Inserts a row in
 * the `orders` table using the service-role client to bypass RLS (the
 * "anyone can create order" policy would also allow it via the anon key,
 * but using service-role keeps the audit trail server-side and stops
 * malicious clients from forging admin-only fields).
 *
 * Payment integration is still TODO (Meshulam aggregator → card + Bit + Apple/Google Pay).
 * For now we record payment_method but mark payment_status='pending'.
 *
 * Returns: { ok, id (uuid), orderNumber (JD-XXXXXXXX) }.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  // ---- Validate ----------------------------------------------------------
  const items = (body.items as OrderItem[] | undefined) ?? [];
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "empty-cart" }, { status: 400 });
  }
  const customer_name = String(body.fullName ?? "").trim();
  const customer_phone = String(body.phone ?? "").trim();
  const shipping_city = String(body.city ?? "").trim();
  const shipping_street = String(body.street ?? "").trim();
  if (!customer_name || !customer_phone || !shipping_city || !shipping_street) {
    return NextResponse.json(
      {
        error: "missing-fields",
        details: { customer_name, customer_phone, shipping_city, shipping_street },
      },
      { status: 400 },
    );
  }

  const totals = (body.totals as
    | { subtotal?: number; shipping?: number; total?: number }
    | undefined) ?? {};
  const subtotal = Number(totals.subtotal ?? 0);
  const shipping_cost = Number(totals.shipping ?? 0);
  const total = Number(totals.total ?? 0);
  if (!Number.isFinite(total) || total <= 0) {
    return NextResponse.json({ error: "invalid-total" }, { status: 400 });
  }

  // ---- Insert ------------------------------------------------------------
  let supabase;
  try {
    supabase = getServiceSupabase();
  } catch (err) {
    console.error("[orders] service-role key missing", err);
    return NextResponse.json(
      { error: "server-misconfigured" },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_name,
      customer_phone,
      customer_email: String(body.email ?? "").trim() || null,
      shipping_city,
      shipping_street,
      shipping_building: String(body.building ?? "").trim() || null,
      shipping_apartment: String(body.apartment ?? "").trim() || null,
      shipping_postal: String(body.postal ?? "").trim() || null,
      items,
      subtotal,
      shipping_cost,
      total,
      payment_method: String(body.payment ?? "card"),
      payment_status: "pending",
      status: "awaiting_batch",
      is_test: Boolean(body.isTest),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[orders] insert failed", error);
    return NextResponse.json(
      { error: "insert-failed", message: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    orderNumber: shortOrderId(data.id),
  });
}
