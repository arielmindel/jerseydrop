import { NextResponse } from "next/server";

/**
 * Order creation stub.
 * TODO: Wire to Tranzila / Cardcom (Israeli card processors), PayPal SDK,
 * and Bit Business API. For now we accept the payload and return an order number.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.items?.length) {
      return NextResponse.json({ error: "empty-cart" }, { status: 400 });
    }
    const orderNumber = `JD${Math.floor(100000 + Math.random() * 900000)}`;
    // TODO: persist order to DB and trigger fulfillment webhook to supplier portal.
    console.log("[orders] new order", {
      orderNumber,
      email: body.email,
      payment: body.payment,
      total: body?.totals?.total,
      itemsCount: body.items.length,
    });
    return NextResponse.json({ orderNumber, status: "received" });
  } catch (err) {
    console.error("[orders] error", err);
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }
}
