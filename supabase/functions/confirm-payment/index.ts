// Marks a booking Paid once Stripe confirms the test payment.
// Body: { sessionId }. This service-role function is the only way a booking becomes Paid:
// guard_booking_update (migration 0004) refuses that step from the app.
import { adminClient, callerId, corsHeaders, json, stripeKey } from "../_shared/common.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await callerId(req);
    if (!userId) return json(req, { error: "Log in to confirm the payment." }, 401);

    const { sessionId } = await req.json();
    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_test_")) {
      return json(req, { error: "That isn't a test-mode payment." }, 400);
    }

    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${stripeKey()}` },
    });
    const session = await res.json();
    if (!res.ok) return json(req, { error: session.error?.message ?? "Stripe couldn't find the payment." }, 502);
    if (session.payment_status !== "paid") return json(req, { error: "The payment hasn't gone through." }, 402);

    const bookingId = session.metadata?.booking_id;
    const admin = adminClient();
    const { data: booking } = await admin
      .from("bookings")
      .select("id, owner_id, status, total")
      .eq("id", bookingId)
      .maybeSingle();

    if (!booking || booking.owner_id !== userId) return json(req, { error: "Booking not found." }, 404);
    if (booking.status === "paid") return json(req, { status: "paid" }); // already confirmed (page refreshed)
    if (booking.status !== "accepted") return json(req, { error: "This booking can't be paid now." }, 409);
    if (session.currency !== "cad" || session.amount_total !== Math.round(Number(booking.total) * 100)) {
      return json(req, { error: "The amount paid doesn't match the booking." }, 409);
    }

    const { error } = await admin.from("bookings").update({ status: "paid" }).eq("id", booking.id).eq("status", "accepted");
    if (error) return json(req, { error: error.message }, 500);
    return json(req, { status: "paid" });
  } catch (err) {
    return json(req, { error: err instanceof Error ? err.message : "Payment confirmation failed." }, 500);
  }
});
