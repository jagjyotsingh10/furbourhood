// Marks a booking Paid once Stripe confirms the test payment.
// Body: { sessionId }. This service-role function is the only way a booking becomes Paid:
// guard_booking_update (migration 0004) refuses that step from the app.
// Self-contained (no shared imports) so it can be pasted into the Supabase dashboard editor.
import { createClient } from "jsr:@supabase/supabase-js@2";

// The browser origins allowed to call the functions and be sent back to after checkout.
// Set ALLOWED_ORIGINS in the function secrets, comma separated, e.g. "https://furbourhood.vercel.app".
const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0]!,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function appOrigin(req: Request): string | null {
  const origin = req.headers.get("origin") ?? "";
  return allowed.includes(origin) ? origin : null;
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

/** Stripe secret key, test mode only: a live key is refused so no real card is ever charged. */
export function stripeKey(): string {
  const key = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  if (!key.startsWith("sk_test_")) throw new Error("Payments are set up for Stripe test mode only (a sk_test_ key).");
  return key;
}

/** The signed-in user who called the function, from their Authorization header. */
export async function callerId(req: Request): Promise<string | null> {
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

/** Service-role client: bypasses RLS, so every use checks ownership itself first. */
export function adminClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

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
