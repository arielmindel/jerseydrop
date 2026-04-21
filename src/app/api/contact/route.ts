import { NextResponse } from "next/server";

/**
 * Contact form stub.
 * TODO: Wire to a transactional email service (Resend / Postmark / Mailgun).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const required = ["name", "email", "subject", "message"] as const;
    for (const field of required) {
      if (!body?.[field] || typeof body[field] !== "string") {
        return NextResponse.json({ error: `missing-${field}` }, { status: 400 });
      }
    }
    console.log("[contact] inbound", {
      name: body.name,
      email: body.email,
      subject: body.subject,
    });
    return NextResponse.json({ status: "received" });
  } catch (err) {
    console.error("[contact] error", err);
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }
}
