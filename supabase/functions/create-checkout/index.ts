// Starts a Stripe Checkout (test mode) for an accepted booking that belongs to the caller.
// Body: { bookingId }. Returns { url } to send the browser to.
import { adminClient, appOrigin, callerId, corsHeaders, json, stripeKey } from "../_shared/common.ts";

const SERVICE_LABELS: Record<string, string> = {
  walking: "Dog walking",
  "drop-in": "Drop-in visits",
  sitting: "Pet sitting",
  boarding: "Boarding",
  daycare: "Daycare",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await callerId(req);
    if (!userId) return json(req, { error: "Log in to pay." }, 401);
    const origin = appOrigin(req);
    if (!origin) return json(req, { error: "This app address isn't allowed to take payments." }, 403);

    const { bookingId } = await req.json();
    const { data: booking } = await adminClient()
      .from("bookings")
      .select("id, owner_id, status, total, service, start_date, end_date, providers(name)")
      .eq("id", bookingId)
      .maybeSingle();

    if (!booking || booking.owner_id !== userId) return json(req, { error: "Booking not found." }, 404);
    if (booking.status !== "accepted") return json(req, { error: "Only accepted bookings can be paid." }, 400);

    const provider = (booking.providers as { name: string } | null)?.name ?? "your provider";
    const dates = booking.start_date === booking.end_date ? booking.start_date : `${booking.start_date} to ${booking.end_date}`;
    const form = new URLSearchParams({
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "cad",
      "line_items[0][price_data][unit_amount]": String(Math.round(Number(booking.total) * 100)),
      "line_items[0][price_data][product_data][name]": `${SERVICE_LABELS[booking.service] ?? booking.service} with ${provider}`,
      "line_items[0][price_data][product_data][description]": dates,
      "metadata[booking_id]": booking.id,
      success_url: `${origin}/bookings?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/bookings`,
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${stripeKey()}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const session = await res.json();
    if (!res.ok) return json(req, { error: session.error?.message ?? "Stripe couldn't start the payment." }, 502);
    return json(req, { url: session.url });
  } catch (err) {
    return json(req, { error: err instanceof Error ? err.message : "Payment failed to start." }, 500);
  }
});
