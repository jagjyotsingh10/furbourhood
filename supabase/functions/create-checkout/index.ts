// Starts a Stripe Checkout (test mode) for an accepted booking that belongs to the caller.
// Body: { bookingId }. Returns { url } to send the browser to.
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
